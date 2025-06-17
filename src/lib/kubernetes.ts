import { KubernetesSiteType, SiteFormType, SiteType } from '@/types/site';
import * as k8s from '@kubernetes/client-node';
import { getCategoriesFromPlugins, getPluginsFromCategories } from './plugins';
import { ensureSlashAtEnd } from './utils';
import { INFRASTRUCTURES } from '@/constants/infrastructures';
import { APIError } from '@/types/error';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
export const customObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);

const WORDPRESS_GROUP = 'wordpress.epfl.ch';
const WORDPRESS_VERSION = 'v2';
const WORDPRESS_PLURAL = 'wordpresssites';
const DEFAULT_NAMESPACE = 'default';
const FALLBACK_NAMESPACE = 'svc0041t-wordpress';

export async function getNamespace(): Promise<string> {
	try {
		if (process.env.K8S_NAMESPACE) {
			return process.env.K8S_NAMESPACE;
		}
		return FALLBACK_NAMESPACE;
	} catch (error) {
		console.warn('Could not determine namespace, using default:', error);
		return DEFAULT_NAMESPACE;
	}
}

function generateSiteName(site: SiteFormType): string {
	const url = new URL(site.url);
	let name = url.hostname.replace(/\.epfl\.ch$/, '');

	name = `${name}${url.pathname}`.replace(/\/$/, '').replaceAll('/', '-');

	let segmentIndex = 1;
	while (name.length >= 50 && segmentIndex < name.split('-').length) {
		const segments = name.split('-');
		const abbreviated = segments
			.slice(0, segmentIndex)
			.map((segment) => segment[0])
			.concat(segments.slice(segmentIndex))
			.join('-');

		name = abbreviated;
		segmentIndex++;
	}

	return name.toLowerCase();
}

async function findKubernetesSiteByUid(uid: string): Promise<{ k8sSite?: KubernetesSiteType; error?: APIError }> {
	try {
		const namespace = await getNamespace();
		const response = await customObjectsApi.listNamespacedCustomObject({
			group: WORDPRESS_GROUP,
			version: WORDPRESS_VERSION,
			namespace,
			plural: WORDPRESS_PLURAL,
		});

		const items = response.items as KubernetesSiteType[];
		if (!items || items.length === 0) {
			return { error: { status: 404, message: 'No sites found', success: false } };
		}

		const k8sSite = items.find((item: KubernetesSiteType) => item.metadata.uid === uid);
		if (!k8sSite) {
			return { error: { status: 404, message: 'Site not found', success: false } };
		}

		return { k8sSite };
	} catch (error) {
		console.error('Error finding Kubernetes site by UID:', error);
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

function mapKubernetesToSite(item: KubernetesSiteType): SiteType {
	const isTemporary = item.metadata.labels?.['app.kubernetes.io/managed-by'] === 'wp-kleenex';
	const infrastructure = isTemporary ? INFRASTRUCTURES.TEMPORARY.NAME : INFRASTRUCTURES.KUBERNETES.NAME;

	return {
		id: item.metadata.uid,
		url: ensureSlashAtEnd(`https://${item.spec.hostname}${item.spec.path}`),
		infrastructure,
		tagline: item.spec.wordpress.tagline,
		title: item.spec.wordpress.title,
		theme: item.spec.wordpress.theme,
		unitId: item.spec.owner?.epfl?.unitId || 0,
		languages: item.spec.wordpress.languages || [],
		createdAt: new Date(item.metadata.creationTimestamp),
		categories: getCategoriesFromPlugins(item.spec.wordpress.plugins) || [],
		downloadsProtectionScript: item.spec.wordpress.downloadsProtectionScript ? true : false,
		tags: [],
	};
}

function createSiteSpec(site: SiteFormType, name: string, namespace: string) {
	const url = new URL(site.url);
	const plugins = getPluginsFromCategories(site.categories || []);

	return {
		apiVersion: `${WORDPRESS_GROUP}/${WORDPRESS_VERSION}`,
		kind: 'WordpressSite',
		metadata: {
			name,
			namespace,
			labels: {
				'app.kubernetes.io/managed-by': 'wp-veritas',
			},
		},
		spec: {
			owner: {
				epfl: {
					unitId: site?.unitId,
				},
			},
			wordpress: {
				debug: false,
				title: site.title,
				tagline: site.tagline,
				theme: site.theme,
				languages: site.languages,
				plugins,
			},
			hostname: url.hostname,
			path: url.pathname.replace(/\/$/, '') || '/',
		},
	};
}

export async function getKubernetesSite(id: string): Promise<{ site?: SiteType; error?: APIError }> {
	try {
		const { sites, error } = await getKubernetesSites();
		if (error) return { error };

		if (!sites || sites.length === 0) {
			return { error: { status: 404, message: 'No sites found', success: false } };
		}

		const site = sites.find((s) => s.id === id);
		if (!site) {
			return { error: { status: 404, message: 'Site not found', success: false } };
		}

		return { site };
	} catch (error) {
		console.error('Error fetching WordPress site:', error);
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function createKubernetesSite(site: SiteFormType): Promise<{ siteId?: string; error?: APIError }> {
	try {
		const namespace = await getNamespace();
		const name = generateSiteName(site);
		const siteSpec = createSiteSpec(site, name, namespace);

		const response = await customObjectsApi.createNamespacedCustomObject({
			group: WORDPRESS_GROUP,
			version: WORDPRESS_VERSION,
			namespace,
			plural: WORDPRESS_PLURAL,
			body: siteSpec,
		});

		if (!response) {
			return { error: { status: 500, message: 'Failed to create WordPress site', success: false } };
		}

		const siteId = response.metadata?.uid;
		if (!siteId) {
			return { error: { status: 500, message: 'Site created but no ID returned', success: false } };
		}

		return { siteId };
	} catch (error) {
		console.error('Error creating WordPress site:', error);
		if (typeof error === 'object' && error !== null && 'response' in error && typeof (error as { response?: { statusCode?: number } }).response === 'object' && (error as { response?: { statusCode?: number } }).response?.statusCode === 409) {
			return { error: { status: 409, message: 'Site already exists', success: false } };
		}
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function updateKubernetesSite(id: string, siteData: SiteFormType): Promise<{ site?: SiteType; error?: APIError }> {
	try {
		const namespace = await getNamespace();

		const { site: existingSite, error: fetchError } = await getKubernetesSite(id);
		if (fetchError) return { error: fetchError };
		if (!existingSite) {
			return { error: { status: 404, message: 'Site not found', success: false } };
		}

		const { k8sSite, error: findError } = await findKubernetesSiteByUid(id);
		if (findError) return { error: findError };
		if (!k8sSite) {
			return { error: { status: 404, message: 'Site not found in Kubernetes', success: false } };
		}

		const patchOperations = [];

		if (siteData.title !== existingSite.title) {
			patchOperations.push({
				op: 'replace',
				path: '/spec/wordpress/title',
				value: siteData.title,
			});
		}

		if (siteData.tagline !== existingSite.tagline) {
			patchOperations.push({
				op: 'replace',
				path: '/spec/wordpress/tagline',
				value: siteData.tagline,
			});
		}

		if (siteData.theme !== existingSite.theme) {
			patchOperations.push({
				op: 'replace',
				path: '/spec/wordpress/theme',
				value: siteData.theme,
			});
		}

		const languagesChanged = JSON.stringify(siteData.languages?.sort()) !== JSON.stringify(existingSite.languages?.sort());
		if (languagesChanged) {
			patchOperations.push({
				op: 'replace',
				path: '/spec/wordpress/languages',
				value: siteData.languages || [],
			});
		}

		const categoriesChanged = JSON.stringify(siteData.categories?.sort()) !== JSON.stringify(existingSite.categories?.sort());
		if (categoriesChanged) {
			const plugins = getPluginsFromCategories(siteData.categories || []);
			patchOperations.push({
				op: 'replace',
				path: '/spec/wordpress/plugins',
				value: plugins,
			});
		}

		if (siteData.unitId !== existingSite.unitId) {
			patchOperations.push({
				op: 'replace',
				path: '/spec/owner/epfl/unitId',
				value: siteData.unitId,
			});
		}

		if (siteData.url !== existingSite.url) {
			const newUrl = new URL(siteData.url);
			patchOperations.push(
				{
					op: 'replace',
					path: '/spec/hostname',
					value: newUrl.hostname,
				},
				{
					op: 'replace',
					path: '/spec/path',
					value: newUrl.pathname.replace(/\/$/, '') || '/',
				}
			);
		}

		if (patchOperations.length === 0) {
			return { site: existingSite };
		}

		await customObjectsApi.patchNamespacedCustomObject({
			group: WORDPRESS_GROUP,
			version: WORDPRESS_VERSION,
			namespace,
			plural: WORDPRESS_PLURAL,
			name: k8sSite.metadata.name,
			body: patchOperations,
		});

		const { site: updatedSite, error: updateError } = await getKubernetesSite(id);
		if (updateError) return { error: updateError };

		return { site: updatedSite };
	} catch (error) {
		console.error('Error updating WordPress site:', error);
		if (typeof error === 'object' && error !== null && 'response' in error && typeof (error as { response?: { statusCode?: number } }).response === 'object' && (error as { response?: { statusCode?: number } }).response?.statusCode === 409) {
			return { error: { status: 409, message: 'Site already exists', success: false } };
		}
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function deleteKubernetesSite(id: string): Promise<{ success?: boolean; error?: APIError }> {
	try {
		const namespace = await getNamespace();

		const { k8sSite, error: findError } = await findKubernetesSiteByUid(id);
		if (findError) return { error: findError };
		if (!k8sSite) {
			return { error: { status: 404, message: 'Site not found', success: false } };
		}

		await customObjectsApi.deleteNamespacedCustomObject({
			group: WORDPRESS_GROUP,
			version: WORDPRESS_VERSION,
			namespace,
			plural: WORDPRESS_PLURAL,
			name: k8sSite.metadata.name,
		});

		return { success: true };
	} catch (error) {
		console.error('Error deleting WordPress site:', error);
		if (typeof error === 'object' && error !== null && 'response' in error && typeof (error as { response?: { statusCode?: number } }).response === 'object' && (error as { response?: { statusCode?: number } }).response?.statusCode === 409) {
			return { error: { status: 409, message: 'Site already exists', success: false } };
		}
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function getKubernetesSites(): Promise<{ sites?: SiteType[]; error?: APIError }> {
	try {
		const namespace = await getNamespace();
		const response = await customObjectsApi.listNamespacedCustomObject({
			group: WORDPRESS_GROUP,
			version: WORDPRESS_VERSION,
			namespace,
			plural: WORDPRESS_PLURAL,
		});

		const items = response.items as KubernetesSiteType[];
		if (!items) {
			return { error: { status: 404, message: 'No sites found', success: false } };
		}

		const sites = items.map(mapKubernetesToSite);
		return { sites };
	} catch (error) {
		console.error('Error fetching WordPress sites:', error);
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}
