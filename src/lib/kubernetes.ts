import { KubernetesSiteType, SiteType } from '@/types/site';
import * as k8s from '@kubernetes/client-node';
import { getCategoriesFromPlugins } from './plugins';
import { ensureSlashAtEnd } from './utils';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
export const customObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);

export async function getNamespace(): Promise<string> {
	try {
		if (process.env.K8S_NAMESPACE) {
			return process.env.K8S_NAMESPACE;
		}

		return 'svc0041t-wordpress';
	} catch (error) {
		console.warn('Could not auto-detect namespace:', error);
	}

	return 'default';
}

export async function getWordpressSite(id: string): Promise<SiteType | null> {
	try {
		const sites = await getWordpressSites();
		if (!sites) {
			return null;
		}

		const site = sites.find((s) => s.id === id);
		if (!site) {
			return null;
		}
		return site;
	} catch (error) {
		console.error('Error fetching WordPress site:', error);
		return null;
	}
}

export async function getWordpressSites(): Promise<SiteType[] | null> {
	try {
		const namespace = await getNamespace();
		const response: { items: KubernetesSiteType[] } = await customObjectsApi.listNamespacedCustomObject({
			group: 'wordpress.epfl.ch',
			version: 'v2',
			namespace,
			plural: 'wordpresssites',
		});

		if (!response?.items) {
			return null;
		}

		return response.items.map((item: KubernetesSiteType) => ({
			id: item.metadata.uid,
			url: ensureSlashAtEnd(new URL('https://' + item.spec.hostname + item.spec.path).href),
			tagline: item.spec.wordpress.tagline,
			title: item.spec.wordpress.title,
			theme: item.spec.wordpress.theme,
			unitId: item.spec.owner?.epfl?.unitId || 0,
			languages: item.spec.wordpress.languages || [],
			categories: getCategoriesFromPlugins(item.spec.wordpress.plugins) || [],
		}));
	} catch (error) {
		console.error('Error fetching WordPress sites:', error);
		return null;
	}
}
