import { APIError } from '@/types/error';
import { SearchSiteType, SiteFormType, SiteType } from '@/types/site';
import { hasPermission } from './policy';
import { PERMISSIONS } from '@/constants/permissions';
import { getWordpressSites } from '@/lib/kubernetes';
import { getEditors, getUnit } from '@/lib/api';

export async function createSite(site: SiteFormType): Promise<APIError> {
	if (!(await hasPermission(PERMISSIONS.SITES.CREATE))) return { status: 403, message: 'Forbidden', success: false };

	return { status: 501, message: 'Not implemented', success: false };
}

export async function updateSite(site: SiteFormType): Promise<APIError> {
	if (!(await hasPermission(PERMISSIONS.SITES.UPDATE))) return { status: 403, message: 'Forbidden', success: false };

	return { status: 501, message: 'Not implemented', success: false };
}

export async function deleteSite(siteId: string): Promise<APIError> {
	if (!(await hasPermission(PERMISSIONS.SITES.DELETE))) return { status: 403, message: 'Forbidden', success: false };

	const site = await getSite(siteId);

	console.log('deleteSite', site);
	return { status: 501, message: 'Not implemented', success: false };
}

export async function getSite(siteId: string): Promise<{ site?: SiteType[]; error?: APIError }> {
	if (!(await hasPermission(PERMISSIONS.SITES.READ))) return { error: { status: 403, message: 'Forbidden', success: false } };

	// const kubernetesSites = await getWordpressSites();

	return { status: 501, message: 'Not implemented', success: false };
}

export async function listSites(): Promise<{ sites?: SiteType[]; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.LIST))) return { error: { status: 403, message: 'Forbidden', success: false } };

		const kubernetesSites = await getWordpressSites();
		if (!kubernetesSites) {
			return { error: { status: 404, message: 'No sites found', success: false } };
		}

		return { sites: kubernetesSites };
	} catch (error) {
		console.error('Error listing sites:', error);
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function searchSites(url: string): Promise<{ sites?: SearchSiteType[]; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.LIST))) return { error: { status: 403, message: 'Forbidden', success: false } };

		const { sites, error } = await listSites();
		if (error) return { error };

		if (!sites || sites.length === 0) return { error: { status: 404, message: 'No sites found', success: false } };

		const filteredSites = sites
			.filter((site) => {
				try {
					const [siteUrl, searchUrl] = [new URL(site.url), new URL(url)];
					if (siteUrl.hostname !== searchUrl.hostname) return false;

					const [sitePath, searchPath] = [siteUrl.pathname.replace(/\/$/, '') || '/', searchUrl.pathname.replace(/\/$/, '') || '/'];

					return sitePath === searchPath || (searchPath.startsWith(sitePath) && sitePath !== '/');
				} catch {
					return false;
				}
			})
			.sort((a, b) => b.url.length - a.url.length)
			.slice(0, 1);

		if (filteredSites.length === 0) return { error: { status: 404, message: 'No sites found matching the URL', success: false } };

		const searchSites = await Promise.all(
			filteredSites.map(async (site) => ({
				id: site.id,
				url: site.url,
				loginUrl: site.url.endsWith('/') ? `${site.url}wp-admin/` : `${site.url}/wp-admin/`,
				unit: await getUnit(site.unitId.toString()),
				lastModified: {
					date: '2025-05-21 15:35:50',
					user: 'obieler',
				},
				recentModifications: [
					{ date: '2025-06-06 14:49:29', user: 'Dominique Quatravaux', page: 'Auto Draft', available: true },
					{ date: '2025-05-27 09:24:38', user: 'Saskya Panchaud', page: 'page non disponible', available: false },
					{ date: '2025-05-27 09:24:37', user: 'Saskya Panchaud', page: 'page non disponible', available: false },
					{ date: '2025-05-27 09:15:26', user: 'Saskya Panchaud', page: 'page non disponible', available: false },
					{ date: '2025-05-23 12:07:46', user: 'Jérémy Würsch', page: 'Memento FR', available: true },
				],
				permissions: {
					editors: await getEditors(site.unitId.toString()),
					accreditors: ['admin.epfl', 'mediacom.admin'],
				},
			}))
		);

		return { sites: searchSites };
	} catch (error) {
		console.error('Error searching sites:', error);
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}
