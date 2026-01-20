import { KubernetesSiteType, SiteFormType, KubernetesSite, KubernetesSiteFormType, KubernetesSiteExtraInfo, WordPressPlugins } from "@/types/site";
import { BackupEnvironment } from "@/types/backup";
import * as k8s from "@kubernetes/client-node";
import { getCategoriesFromPlugins, getKubernetesPluginStruct } from "./plugins";
import { ensureNoSlashAtEnd, ensureSlashAtEnd } from "./utils";
import { APIError } from "@/types/error";
import { extractLanguages } from "./languages";
import { INFRASTRUCTURES } from "@/constants/infrastructures";
import { cache, withCache } from "./redis";
import { getBackupConfig } from "@/services/backup";
import { createApplication } from "./entra";

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
		console.warn("Could not determine namespace, using default:", error);
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
		console.error(`Error reading ConfigMap ${configMapName}:`, error);
		return null;
	}
}

function generateSiteName(site: KubernetesSiteFormType): string {
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
			return { error: { status: 404, message: "No sites found", success: false } };
		}

		const k8sSite = items.find((item: KubernetesSiteType) => item.metadata.uid === uid);
		if (!k8sSite) {
			return { error: { status: 404, message: "Site not found", success: false } };
		}

		return { k8sSite };
	} catch (error) {
		console.error("Error finding Kubernetes site by UID:", error);
		return { error: { status: 500, message: "Internal Server Error", success: false } };
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
		entra: {
			appId: item.spec.appPortal?.appId || "",
			tenantId: process.env.ENTRA_WORDPRESS_TENANT_ID || "",
		},
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

async function createSiteSpec(site: KubernetesSiteFormType, name: string, namespace: string) {
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
			}).then(res => res.json());

			const backupSite = sites?.find((s: KubernetesSite) => s.id === site.backupSite);
			if (!backupSite) throw new Error("Backup site not found");

			const oldSite = await fetch(config.api.url + `/${backupSite.id}`, {
				method: "GET",
				headers: { "Content-Type": "application/json" },
				signal: AbortSignal.timeout(10000),
			}).then(res => res.json());

			dbName = oldSite.kubernetesExtraInfo?.databaseName;
			dbRef = oldSite.kubernetesExtraInfo?.databaseRef;
			urlSource = ensureNoSlashAtEnd(oldSite.url);

			const mediaPvcSubPath = process.env.PVC_NAME === config.media.claimName ? oldSite.kubernetesExtraInfo?.wordpressSiteName : `${oldSite.kubernetesExtraInfo?.namespace}-${oldSite.kubernetesExtraInfo?.pvcName}-${oldSite.kubernetesExtraInfo?.pvName}/${oldSite.kubernetesExtraInfo?.wordpressSiteName}`;

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

	const app = await createApplication({
		title: site.title,
		tagline: site.tagline,
		url: site.url,
		infrastructure: site.infrastructure,
		kubernetesExtraInfo: {
			wordpressSiteName: name,
		},
	} as KubernetesSite);

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
		entra: {
			appId: app.App.appId,
			tenantId: process.env.ENTRA_WORDPRESS_TENANT_ID || "",
		},
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
			...(site.createFromBackup && backupConfig.restoreConfig && {
				restore: backupConfig.restoreConfig,
			}),
			appPortal: {
				appId: app.App.appId,
			},
			hostname: url.hostname,
			path: url.pathname.replace(/\/$/, "") || "/",
		},
	};
};

export async function getKubernetesSite(id: string): Promise<{ site?: KubernetesSite; error?: APIError }> {
	try {
		const { k8sSite, error } = await findKubernetesSiteByUid(id);
		if (error) return { error };
		if (!k8sSite) {
			return { error: { status: 404, message: "Site not found", success: false } };
		}

		const site = mapKubernetesToSite(k8sSite);
		const extras = await getKubernetesSiteExtraInfo(id);

		return { site, ...extras };
	} catch (error) {
		console.error("Error fetching WordPress site:", error);
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function createKubernetesSite(site: SiteFormType): Promise<{ siteId?: string; error?: APIError }> {
	try {
		if (site.infrastructure !== "Kubernetes") {
			return { error: { status: 400, message: "Invalid infrastructure for Kubernetes creation", success: false } };
		}

		const kubernetesSite = site as KubernetesSiteFormType;

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
			return { error: { status: 500, message: "Failed to create WordPress site", success: false } };
		}

		cache.invalidateSitesCache();
		const siteId = response.metadata?.uid;
		if (!siteId) {
			return { error: { status: 500, message: "Site created but no ID returned", success: false } };
		}

		return { siteId };
	} catch (error) {
		console.error("Error creating WordPress site:", error);
		if (typeof error === "object" && error !== null && "response" in error && typeof (error as { response?: { statusCode?: number } }).response === "object" && (error as { response?: { statusCode?: number } }).response?.statusCode === 409) {
			return { error: { status: 409, message: "Site already exists", success: false } };
		}
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function updateKubernetesSite(id: string, siteData: SiteFormType): Promise<{ site?: KubernetesSite; error?: APIError }> {
	try {
		if (siteData.infrastructure !== "Kubernetes") {
			return { error: { status: 400, message: "Invalid infrastructure for Kubernetes update", success: false } };
		}

		const kubernetesSiteData = siteData as KubernetesSiteFormType;
		const namespace = await getNamespace();

		const { site: existingSite, error: fetchError } = await getKubernetesSite(id);
		if (fetchError) return { error: fetchError };
		if (!existingSite) {
			return { error: { status: 404, message: "Site not found", success: false } };
		}

		const { k8sSite, error: findError } = await findKubernetesSiteByUid(id);
		if (findError) return { error: findError };
		if (!k8sSite) {
			return { error: { status: 404, message: "Site not found in Kubernetes", success: false } };
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

		const languagesChanged = JSON.stringify(kubernetesSiteData.languages?.sort()) !== JSON.stringify(existingSite.languages?.sort());
		const categoriesChanged = JSON.stringify(kubernetesSiteData.categories?.sort()) !== JSON.stringify(existingSite.categories?.sort());
		const unitId = kubernetesSiteData.unitId !== existingSite.unitId;

		if (categoriesChanged || languagesChanged || unitId) {
			const tempSite: KubernetesSite = {
				...existingSite,
				languages: kubernetesSiteData.languages || [],
				categories: kubernetesSiteData.categories || [],
				unitId: kubernetesSiteData.unitId,
			};
			const plugins = await getKubernetesPluginStruct(tempSite);
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

		cache.invalidateSitesCache();
		const { site: updatedSite, error: updateError } = await getKubernetesSite(id);
		if (updateError) return { error: updateError };

		return { site: updatedSite };
	} catch (error) {
		console.error("Error updating WordPress site:", error);
		if (typeof error === "object" && error !== null && "response" in error && typeof (error as { response?: { statusCode?: number } }).response === "object" && (error as { response?: { statusCode?: number } }).response?.statusCode === 409) {
			return { error: { status: 409, message: "Site already exists", success: false } };
		}
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function deleteKubernetesSite(id: string): Promise<{ success?: boolean; error?: APIError }> {
	try {
		const namespace = await getNamespace();

		const { k8sSite, error: findError } = await findKubernetesSiteByUid(id);
		if (findError) return { error: findError };
		if (!k8sSite) {
			return { error: { status: 404, message: "Site not found", success: false } };
		}

		await k8sCustomObjectsApi.deleteNamespacedCustomObject({
			group: WORDPRESS_GROUP,
			version: WORDPRESS_VERSION,
			namespace,
			plural: WORDPRESS_PLURAL,
			name: k8sSite.metadata.name,
		});

		cache.invalidateSitesCache();
		return { success: true };
	} catch (error) {
		console.error("Error deleting WordPress site:", error);
		if (typeof error === "object" && error !== null && "response" in error && typeof (error as { response?: { statusCode?: number } }).response === "object" && (error as { response?: { statusCode?: number } }).response?.statusCode === 409) {
			return { error: { status: 409, message: "Site already exists", success: false } };
		}
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function getKubernetesSites(): Promise<{ sites?: KubernetesSite[]; error?: APIError }> {
	const cacheKey = "kubernetes-sites";

	return withCache(cacheKey, async () => {
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
				return {
					error: { status: 404, message: "No sites found", success: false },
				};
			}

			const kubernetesSites = items.map(mapKubernetesToSite);

			return { sites: kubernetesSites };
		} catch (error) {
			console.error("Error fetching Kubernetes sites:", error);
			return {
				error: { status: 500, message: "Internal Server Error", success: false },
			};
		}
	}, 480); // 8 minutes cache
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

		const ingress = ingresses.items.find((ing) =>
			ing.metadata && ing.metadata.ownerReferences?.some(ref => ref.uid === k8sSite.metadata.uid),
		);

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

		const database = (databases.items as DatabaseType[]).find((db) =>
			db.metadata.ownerReferences?.some((ref) => ref.uid === k8sSite.metadata.uid),
		);

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
		console.error("Error extracting Kubernetes site info:", error);
		throw { status: 500, message: "Internal Server Error", success: false };
	}
}
