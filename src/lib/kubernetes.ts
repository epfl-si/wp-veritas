import * as k8s from "@kubernetes/client-node";
import { INFRASTRUCTURES } from "@/constants/infrastructures";
import { getBackupConfig } from "@/services/backup";
import type { BackupEnvironment } from "@/types/backup";
import type { APIError } from "@/types/error";
import type { KubernetesSite, KubernetesSiteExtraInfo, KubernetesSiteForm, SiteForm, WordPressPlugins } from "@/types/site";

// Raw CRD representation as returned by the Kubernetes API
interface KubernetesSiteType {
	metadata: {
		uid: string;
		name: string;
		namespace: string;
		labels?: Record<string, string>;
		creationTimestamp: string;
	};
	spec: {
		owner: {
			epfl: {
				unitId: number;
			};
		};
		hostname: string;
		path: string;
		wordpress: {
			debug: boolean;
			downloadsProtectionScript?: string;
			plugins: WordPressPlugins;
			tagline: string;
			theme: string;
			title: string;
		};
	};
	status?: {
		wordpresssite?: {
			lastCronJobRuntime?: string;
			plugins?: Record<string, object>;
			tagline?: string;
			title?: string;
		};
	};
}

import { httpError } from "./errors";
import { extractLanguages } from "./languages";
import log from "./log";
import { getCategoriesFromPlugins, getKubernetesPluginStruct } from "./plugins";
import { cache, withCache } from "./redis";
import { ensureNoSlashAtEnd, ensureSlashAtEnd } from "./utils";

function captureError(err: unknown): { message: string; stack?: string } {
	if (err instanceof Error) {
		return { message: err.message, stack: err.stack };
	}
	try {
		return { message: JSON.stringify(err) };
	} catch {
		return { message: String(err) };
	}
}

function isK8sConflict(err: unknown): 409 | null {
	if (typeof err === "object" && err !== null && "response" in err) {
		const status = (err as { response?: { statusCode?: number } }).response?.statusCode;
		if (status === 409) return 409;
	}
	return null;
}

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
export const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);
export const k8sCustomObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);

const WORDPRESS_GROUP = "wordpress.epfl.ch";
const WORDPRESS_VERSION = "v2";
const WORDPRESS_PLURAL = "wordpresssites";
const DEFAULT_NAMESPACE = "default";
const FALLBACK_NAMESPACE = "svc0041t-wordpress";

export async function getNamespace(): Promise<string> {
	try {
		if (process.env.K8S_NAMESPACE) {
			return process.env.K8S_NAMESPACE;
		}
		return FALLBACK_NAMESPACE;
	} catch (error) {
		void log.warn("Could not determine namespace, using default", { type: "system", action: "read", error: captureError(error) });
		return DEFAULT_NAMESPACE;
	}
}

export async function getConfigMapValue(configMapName: string, key: string): Promise<string | null> {
	try {
		const namespace = await getNamespace();
		const response = await k8sCoreApi.readNamespacedConfigMap({
			name: configMapName,
			namespace,
		});

		return response.data?.[key] || null;
	} catch (error) {
		void log.error(`Error reading ConfigMap ${configMapName}`, { type: "system", action: "read", error: captureError(error) });
		return null;
	}
}

function generateSiteName(site: KubernetesSiteForm): string {
	const url = new URL(site.url);
	let name = url.hostname.replace(/\.epfl\.ch$/, "");

	name = `${name}${url.pathname}`.replace(/\/$/, "").replaceAll("/", "-");

	let segmentIndex = 1;
	while (name.length >= 50 && segmentIndex < name.split("-").length) {
		const segments = name.split("-");
		const abbreviated = segments
			.slice(0, segmentIndex)
			.map((segment) => segment[0])
			.concat(segments.slice(segmentIndex))
			.join("-");

		name = abbreviated;
		segmentIndex++;
	}

	return name.toLowerCase();
}

async function findKubernetesSiteByUid(uid: string): Promise<{ k8sSite?: KubernetesSiteType; error?: APIError }> {
	try {
		const namespace = await getNamespace();
		const response = await k8sCustomObjectsApi.listNamespacedCustomObject({
			group: WORDPRESS_GROUP,
			version: WORDPRESS_VERSION,
			namespace,
			plural: WORDPRESS_PLURAL,
		});

		const items = response.items as KubernetesSiteType[];
		if (!items || items.length === 0) {
			return httpError.notFound("No sites found");
		}

		const k8sSite = items.find((item: KubernetesSiteType) => item.metadata.uid === uid);
		if (!k8sSite) {
			return httpError.notFound("Site not found");
		}

		return { k8sSite };
	} catch (error) {
		void log.error("Error finding Kubernetes site by UID", { type: "site", action: "read", error: captureError(error) });
		return httpError.internal();
	}
}

function mapKubernetesToSite(item: KubernetesSiteType): KubernetesSite {
	const isTemporary = item.metadata.labels?.["app.kubernetes.io/managed-by"] === "wp-kleenex";

	return {
		id: item.metadata.uid,
		url: ensureSlashAtEnd(`https://${item.spec.hostname}${item.spec.path}`),
		infrastructure: item.metadata.labels?.["app.kubernetes.io/managed-by"] === "wp-kleenex" ? INFRASTRUCTURES.TEMPORARY.NAME : INFRASTRUCTURES.KUBERNETES.NAME,
		tagline: item.status?.wordpresssite?.tagline || item.spec.wordpress.tagline || "",
		title: item.status?.wordpresssite?.title || item.spec.wordpress.title || "",
		theme: item.spec.wordpress.theme || "",
		unitId: item.spec.owner?.epfl?.unitId || 0,
		createdAt: new Date(item.metadata.creationTimestamp),
		languages: extractLanguages(item.spec.wordpress.plugins),
		categories: getCategoriesFromPlugins(item.spec.wordpress.plugins) || [],
		downloadsProtectionScript: Boolean(item.spec.wordpress.downloadsProtectionScript),
		managed: item.metadata.labels?.["app.kubernetes.io/managed-by"] === "wp-veritas" && !isTemporary,
		tags: [],
		ticket: undefined,
		comment: undefined,
		monitored: undefined,
	};
}

async function getPersistentVolumeName(pvcName: string): Promise<string | null> {
	const namespace = await getNamespace();
	const pvc = await k8sCoreApi.readNamespacedPersistentVolumeClaim({
		name: pvcName,
		namespace,
	});

	if (!pvc.spec?.volumeName) {
		return null;
	}

	return pvc.spec.volumeName;
}

async function createSiteSpec(site: KubernetesSiteForm, name: string, namespace: string) {
	const url = new URL(site.url);

	const getBackupConfigForSite = async () => {
		let dbName = null;
		let dbRef = null;
		let urlSource = null;
		let config = null;
		let restoreConfig = null;

		if (site.createFromBackup && site.backupSite && site.backupEnvironment) {
			config = await getBackupConfig(site.backupEnvironment as BackupEnvironment);
			if (!config) throw new Error("Backup configuration not found");
			const sites = await fetch(config.api.url, {
				method: "GET",
				headers: { "Content-Type": "application/json" },
				signal: AbortSignal.timeout(10000),
			}).then((res) => res.json());

			const backupSite = sites?.find((s: KubernetesSite) => s.id === site.backupSite);
			if (!backupSite) throw new Error("Backup site not found");

			const oldSite = await fetch(`${config.api.url}/${backupSite.id}`, {
				method: "GET",
				headers: { "Content-Type": "application/json" },
				signal: AbortSignal.timeout(10000),
			}).then((res) => res.json());

			dbName = oldSite.kubernetesExtraInfo?.databaseName;
			dbRef = oldSite.kubernetesExtraInfo?.databaseRef;
			urlSource = ensureNoSlashAtEnd(oldSite.url);

			const mediaPvcSubPath =
				process.env.PVC_NAME === config.media.claimName
					? oldSite.kubernetesExtraInfo?.wordpressSiteName
					: `${oldSite.kubernetesExtraInfo?.namespace}-${oldSite.kubernetesExtraInfo?.pvcName}-${oldSite.kubernetesExtraInfo?.pvName}/${oldSite.kubernetesExtraInfo?.wordpressSiteName}`;

			restoreConfig = {
				s3: {
					bucket: config.s3.bucket,
					endpoint: config.s3.endpoint,
					secretKeyName: config.s3.secretName,
				},
				wpDbBackupRef: {
					mariaDBLookup: {
						mariadbNameSource: dbRef,
						databaseNameSource: dbName,
						urlSource: urlSource,
						mariadbSecretName: "mariadb",
					},
				},
				mediaPersistentVolumeClaim: {
					claimName: config.media.claimName,
					subPath: mediaPvcSubPath,
				},
			};
		}

		return { dbName, dbRef, urlSource, config, restoreConfig };
	};

	const tempSite: KubernetesSite = {
		id: "temp",
		url: site.url,
		infrastructure: "Kubernetes",
		tagline: site.tagline,
		title: site.title,
		theme: site.theme,
		unitId: site.unitId,
		languages: site.languages,
		categories: site.categories || [],
		downloadsProtectionScript: site.downloadsProtectionScript || false,
		managed: true,
		createdAt: new Date(),
		tags: [],
	};

	const plugins = await getKubernetesPluginStruct(tempSite);
	const backupConfig = await getBackupConfigForSite();

	const createWordPressConfig = (plugins: WordPressPlugins) => ({
		debug: false,
		title: site.title,
		tagline: site.tagline,
		theme: site.theme,
		plugins,
		...(site.downloadsProtectionScript && {
			downloadsProtectionScript: "/wp/wp-content/plugins/epfl-intranet/inc/protect-medias.php",
		}),
	});

	return {
		apiVersion: `${WORDPRESS_GROUP}/${WORDPRESS_VERSION}`,
		kind: "WordpressSite",
		metadata: {
			name,
			namespace,
			labels: {
				"app.kubernetes.io/managed-by": "wp-veritas",
			},
		},
		spec: {
			owner: {
				epfl: {
					unitId: site.unitId,
				},
			},
			wordpress: createWordPressConfig(plugins),
			...(site.createFromBackup &&
				backupConfig.restoreConfig && {
					restore: backupConfig.restoreConfig,
				}),
			hostname: url.hostname,
			path: url.pathname.replace(/\/$/, "") || "/",
		},
	};
}

export async function getKubernetesSite(id: string): Promise<{ site?: KubernetesSite; error?: APIError }> {
	try {
		const { k8sSite, error } = await findKubernetesSiteByUid(id);
		if (error) return { error };
		if (!k8sSite) {
			return httpError.notFound("Site not found");
		}

		const site = mapKubernetesToSite(k8sSite);
		const extras = await getKubernetesSiteExtraInfo(id);

		return { site, ...extras };
	} catch (error) {
		void log.error("Error fetching WordPress site", { type: "site", action: "read", error: captureError(error) });
		return httpError.internal();
	}
}

export async function createKubernetesSite(site: SiteForm): Promise<{ siteId?: string; error?: APIError }> {
	try {
		if (site.infrastructure !== "Kubernetes") {
			return httpError.badRequest("Invalid infrastructure for Kubernetes creation");
		}

		const kubernetesSite = site as KubernetesSiteForm;

		const namespace = await getNamespace();
		const name = generateSiteName(kubernetesSite);
		const siteSpec = await createSiteSpec(kubernetesSite, name, namespace);

		const response = await k8sCustomObjectsApi.createNamespacedCustomObject({
			group: WORDPRESS_GROUP,
			version: WORDPRESS_VERSION,
			namespace,
			plural: WORDPRESS_PLURAL,
			body: siteSpec,
		});

		if (!response) {
			return httpError.internal();
		}

		await cache.invalidateSitesCache();
		const siteId = response.metadata?.uid;
		if (!siteId) {
			return httpError.internal();
		}

		return { siteId };
	} catch (error) {
		const k8sStatus = isK8sConflict(error);
		void log.error("Error creating WordPress site", { type: "site", action: "create", error: captureError(error) });
		return k8sStatus ? httpError.conflict("Site already exists") : httpError.internal();
	}
}

export async function updateKubernetesSite(id: string, siteData: SiteForm): Promise<{ site?: KubernetesSite; error?: APIError }> {
	try {
		if (siteData.infrastructure !== "Kubernetes") {
			return httpError.badRequest("Invalid infrastructure for Kubernetes update");
		}

		const kubernetesSiteData = siteData as KubernetesSiteForm;
		const namespace = await getNamespace();

		const { site: existingSite, error: fetchError } = await getKubernetesSite(id);
		if (fetchError) return { error: fetchError };
		if (!existingSite) {
			return httpError.notFound("Site not found");
		}

		const { k8sSite, error: findError } = await findKubernetesSiteByUid(id);
		if (findError) return { error: findError };
		if (!k8sSite) {
			return httpError.notFound("Site not found in Kubernetes");
		}

		const patchOperations = [];

		if (kubernetesSiteData.title !== existingSite.title) {
			patchOperations.push({
				op: "replace",
				path: "/spec/wordpress/title",
				value: kubernetesSiteData.title,
			});
		}

		if (kubernetesSiteData.tagline !== existingSite.tagline) {
			patchOperations.push({
				op: "replace",
				path: "/spec/wordpress/tagline",
				value: kubernetesSiteData.tagline,
			});
		}

		if (kubernetesSiteData.theme !== existingSite.theme) {
			patchOperations.push({
				op: "replace",
				path: "/spec/wordpress/theme",
				value: kubernetesSiteData.theme,
			});
		}

		const tempSite: KubernetesSite = {
			...existingSite,
			languages: kubernetesSiteData.languages || [],
			categories: kubernetesSiteData.categories || [],
			unitId: kubernetesSiteData.unitId,
		};
		const plugins = await getKubernetesPluginStruct(tempSite);
		const pluginsChanged = JSON.stringify(k8sSite.spec.wordpress.plugins) !== JSON.stringify(plugins);

		if (pluginsChanged) {
			patchOperations.push({
				op: "replace",
				path: "/spec/wordpress/plugins",
				value: plugins,
			});
		}

		if (kubernetesSiteData.unitId !== existingSite.unitId) {
			patchOperations.push({
				op: "replace",
				path: "/spec/owner/epfl/unitId",
				value: kubernetesSiteData.unitId,
			});
		}

		if (kubernetesSiteData.url !== existingSite.url) {
			const newUrl = new URL(kubernetesSiteData.url);
			patchOperations.push(
				{
					op: "replace",
					path: "/spec/hostname",
					value: newUrl.hostname,
				},
				{
					op: "replace",
					path: "/spec/path",
					value: newUrl.pathname.replace(/\/$/, "") || "/",
				},
			);
		}

		if (kubernetesSiteData.downloadsProtectionScript !== existingSite.downloadsProtectionScript) {
			if (kubernetesSiteData.downloadsProtectionScript) {
				patchOperations.push({
					op: "add",
					path: "/spec/wordpress/downloadsProtectionScript",
					value: "/wp/wp-content/plugins/epfl-intranet/inc/protect-medias.php",
				});
			} else {
				patchOperations.push({
					op: "remove",
					path: "/spec/wordpress/downloadsProtectionScript",
				});
			}
		}

		if (patchOperations.length === 0) {
			return { site: existingSite };
		}

		await k8sCustomObjectsApi.patchNamespacedCustomObject({
			group: WORDPRESS_GROUP,
			version: WORDPRESS_VERSION,
			namespace,
			plural: WORDPRESS_PLURAL,
			name: k8sSite.metadata.name,
			body: patchOperations,
		});

		await cache.invalidateSitesCache();
		const { site: updatedSite, error: updateError } = await getKubernetesSite(id);
		if (updateError) return { error: updateError };

		return { site: updatedSite };
	} catch (error) {
		const k8sStatus = isK8sConflict(error);
		void log.error("Error updating WordPress site", { type: "site", action: "update", error: captureError(error) });
		return k8sStatus ? httpError.conflict("Site already exists") : httpError.internal();
	}
}

export async function deleteKubernetesSite(id: string): Promise<{ success?: boolean; error?: APIError }> {
	try {
		const namespace = await getNamespace();

		const { k8sSite, error: findError } = await findKubernetesSiteByUid(id);
		if (findError) return { error: findError };
		if (!k8sSite) {
			return httpError.notFound("Site not found");
		}

		await k8sCustomObjectsApi.deleteNamespacedCustomObject({
			group: WORDPRESS_GROUP,
			version: WORDPRESS_VERSION,
			namespace,
			plural: WORDPRESS_PLURAL,
			name: k8sSite.metadata.name,
		});

		await cache.invalidateSitesCache();
		return { success: true };
	} catch (error) {
		void log.error("Error deleting WordPress site", { type: "site", action: "delete", error: captureError(error) });
		return httpError.internal();
	}
}

export async function getKubernetesSites(): Promise<{
	sites?: KubernetesSite[];
	error?: APIError;
}> {
	const cacheKey = "kubernetes-sites";

	return withCache(
		cacheKey,
		async () => {
			try {
				const namespace = await getNamespace();
				const response = await k8sCustomObjectsApi.listNamespacedCustomObject({
					group: WORDPRESS_GROUP,
					version: WORDPRESS_VERSION,
					namespace,
					plural: WORDPRESS_PLURAL,
				});
				const items = response.items as KubernetesSiteType[];

				if (!items) {
					return httpError.notFound("No sites found");
				}

				const kubernetesSites = items.map(mapKubernetesToSite);

				return { sites: kubernetesSites };
			} catch (error) {
				void log.error("Error fetching Kubernetes sites", { type: "site", action: "list", error: captureError(error) });
				return httpError.internal();
			}
		},
		480,
	); // 8 minutes cache
}

export async function getKubernetesSiteExtraInfo(siteId: string): Promise<KubernetesSiteExtraInfo> {
	try {
		const { k8sSite, error } = await findKubernetesSiteByUid(siteId);
		if (error) throw error;
		if (!k8sSite) {
			throw { status: 404, message: "Site not found", success: false };
		}

		const namespace = await getNamespace();
		const ingresses = await k8sNetworkingApi.listNamespacedIngress({
			namespace,
		});

		const ingress = ingresses.items.find((ing) => ing.metadata?.ownerReferences?.some((ref) => ref.uid === k8sSite.metadata.uid));

		const databases = await k8sCustomObjectsApi.listNamespacedCustomObject({
			group: "k8s.mariadb.com",
			version: "v1alpha1",
			namespace,
			plural: "databases",
		});

		type DatabaseType = {
			metadata: {
				name?: string;
				ownerReferences?: { uid: string }[];
			};
			spec: {
				mariaDbRef: {
					name: string;
				};
			};
		};

		const database = (databases.items as DatabaseType[]).find((db) => db.metadata.ownerReferences?.some((ref) => ref.uid === k8sSite.metadata.uid));

		const pvName = await getPersistentVolumeName(process.env.PVC_NAME || "wordpress-data");

		return {
			siteId: k8sSite.metadata.uid,
			ingressName: ingress?.metadata?.name,
			databaseName: database?.metadata.name,
			databaseRef: database?.spec?.mariaDbRef.name,
			wordpressSiteName: k8sSite.metadata.name,
			pvName: pvName,
			pvcName: process.env.PVC_NAME || "wordpress-data",
			namespace: namespace,
		} as KubernetesSiteExtraInfo;
	} catch (error) {
		void log.error("Error extracting Kubernetes site info", { type: "site", action: "read", error: captureError(error) });
		throw { status: 500, message: "Internal Server Error", success: false };
	}
}
