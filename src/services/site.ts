'use server';
import { APIError } from '@/types/error';
import { SearchSiteType, SiteFormType, SiteType } from '@/types/site';
import { hasPermission } from './policy';
import { PERMISSIONS } from '@/constants/permissions';
import { getEditors, getUnit } from '@/lib/api';
import { INFRASTRUCTURES } from '@/constants/infrastructures';
import { createKubernetesSite, getKubernetesSite, getKubernetesSites, updateKubernetesSite, deleteKubernetesSite } from '@/lib/kubernetes';
import { createDatabaseSite, listDatabaseSites, getDatabaseSite, updateDatabaseSite, deleteDatabaseSite, createDatabaseSiteExtras, updateDatabaseSiteExtras, deleteDatabaseSiteExtras } from '@/lib/database';
import { info, warn, error } from '@/lib/log';
import { ensureSlashAtEnd } from '@/lib/utils';
import { sendSiteCreatedMessage, sendSiteDeletedMessage } from './telegram';

const SITE_EXTRAS = ['ticket', 'comment'] as const;
type SiteExtra = (typeof SITE_EXTRAS)[number];

function extractExtras(site: SiteFormType): Partial<Record<SiteExtra, string>> {
	const extras: Partial<Record<SiteExtra, string>> = {};

	SITE_EXTRAS.forEach((extra) => {
		if (extra in site && site[extra as keyof SiteFormType]) {
			extras[extra] = site[extra as keyof SiteFormType] as string;
		}
	});

	return extras;
}

function mergeSiteWithExtras(kubernetesSite: SiteType, dbSite?: SiteType): SiteType {
	if (!dbSite) return kubernetesSite;

	const merged = { ...kubernetesSite };

	SITE_EXTRAS.forEach((extra) => {
		if (dbSite[extra as keyof SiteType]) {
			(merged as Record<string, unknown>)[extra] = dbSite[extra as keyof SiteType];
		}
	});

	return merged;
}

export async function createSite(site: SiteFormType): Promise<{ siteId?: string; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.CREATE))) {
			await warn(`Permission denied for site creation`, {
				type: 'site',
				action: 'create',
				object: site,
				error: 'Forbidden - insufficient permissions',
			});
			return { error: { status: 403, message: 'Forbidden', success: false } };
		}

		const { sites } = await listSites();
		const siteUrl = ensureSlashAtEnd(site.url);
		if (sites && sites.some((s) => s.url === siteUrl)) {
			return { error: { status: 409, message: 'Site already exists', success: false } };
		}

		const infrastructure = Object.values(INFRASTRUCTURES).find((infra) => infra.NAME === site.infrastructure);
		const persistence = infrastructure?.PERSISTENCE;

		if (!persistence || persistence === 'none') {
			await warn(`Invalid infrastructure specified for site creation`, {
				type: 'site',
				action: 'create',
				object: site,
				error: 'Invalid infrastructure',
			});
			return { error: { status: 400, message: 'Invalid infrastructure', success: false } };
		}

		if (persistence === INFRASTRUCTURES.KUBERNETES.PERSISTENCE) {
			const { siteId, error: kubernetesError } = await createKubernetesSite(site);
			if (kubernetesError) {
				console.error(`Error creating Kubernetes site:`, kubernetesError);
				await error(`Failed to create site`, {
					type: 'site',
					action: 'create',
					object: site,
					error: kubernetesError.message,
				});
				return { error: kubernetesError };
			}

			if (siteId) {
				const extras = extractExtras(site);
				console.log('Extracted extras for site:', extras);
				if (Object.keys(extras).length > 0) {
					await createDatabaseSiteExtras(siteId, extras);
				}

				await info(`The **${site.infrastructure}** site **${site.url}** created successfully`, {
					type: 'site',
					action: 'create',
					id: siteId,
					object: site,
				});
			}

			await sendSiteCreatedMessage(site.url, site.infrastructure);

			return { siteId };
		}

		if (persistence === INFRASTRUCTURES.EXTERNAL.PERSISTENCE) {
			const { siteId, error: databaseError } = await createDatabaseSite(site);
			if (databaseError) {
				await error(`Failed to create site`, {
					type: 'site',
					action: 'create',
					object: site,
					error: databaseError.message,
				});
				return { error: databaseError };
			}

			if (siteId) {
				await info(`The **${site.infrastructure}** site **${site.url}** created successfully`, {
					type: 'site',
					action: 'create',
					id: siteId,
					object: site,
				});
			}

			await sendSiteCreatedMessage(site.url, site.infrastructure);

			return { siteId };
		}

		await warn(`Unsupported persistence type for site creation`, {
			type: 'site',
			action: 'create',
			object: site,
			persistence,
			error: 'Not implemented',
		});
		return { error: { status: 501, message: 'Not implemented', success: false } };
	} catch (errorData) {
		await error(`Failed to create site`, {
			type: 'site',
			action: 'create',
			object: site,
			error: errorData instanceof Error ? errorData.message : 'Unknown error',
		});
		console.error('Error creating site:', errorData);
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function updateSite(siteId: string, site: SiteFormType): Promise<{ error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.UPDATE))) {
			await warn(`Permission denied for site update`, {
				type: 'site',
				action: 'update',
				id: siteId,
				object: site,
				error: 'Forbidden - insufficient permissions',
			});
			return { error: { status: 403, message: 'Forbidden', success: false } };
		}

		const infrastructure = Object.values(INFRASTRUCTURES).find((infra) => infra.NAME === site.infrastructure);
		const persistence = infrastructure?.PERSISTENCE;

		if (persistence === INFRASTRUCTURES.EXTERNAL.PERSISTENCE) {
			const { error: databaseError } = await updateDatabaseSite(siteId, site);
			if (databaseError) {
				await error(`Failed to update site`, {
					type: 'site',
					action: 'update',
					id: siteId,
					object: site,
					error: databaseError.message,
				});
				return { error: databaseError };
			}

			await info(`The **${site.infrastructure}** site **${site.url}** updated successfully`, {
				type: 'site',
				action: 'update',
				id: siteId,
				object: site,
			});
		}

		if (persistence === INFRASTRUCTURES.KUBERNETES.PERSISTENCE) {
			const { error: kubernetesError } = await updateKubernetesSite(siteId, site);
			if (kubernetesError) {
				await error(`Failed to update site`, {
					type: 'site',
					action: 'update',
					id: siteId,
					object: site,
					error: kubernetesError.message,
				});
				return { error: kubernetesError };
			}

			const extras = extractExtras(site);
			if (Object.keys(extras).length > 0) {
				try {
					await updateDatabaseSiteExtras(siteId, extras);
					await info(`Site extras updated successfully for site **${siteId}**`, {
						type: 'site',
						action: 'update_extras',
						id: siteId,
						extras,
					});
				} catch (extrasError) {
					await warn(`Failed to update site extras, but site was updated`, {
						type: 'site',
						action: 'update_extras',
						id: siteId,
						error: extrasError instanceof Error ? extrasError.message : 'Unknown error',
					});
				}
			}

			await info(`The **${site.infrastructure}** site **${site.url}** updated successfully`, {
				type: 'site',
				action: 'update',
				id: siteId,
				object: site,
			});

			return {};
		}

		if (!persistence || persistence === 'none') {
			await warn(`Unsupported persistence type for site update`, {
				type: 'site',
				action: 'update',
				id: siteId,
				object: site,
				persistence,
				error: 'Not implemented',
			});
			return { error: { status: 501, message: 'Not implemented', success: false } };
		}

		return {};
	} catch (errorData) {
		await error(`Failed to update site`, {
			type: 'site',
			action: 'update',
			id: siteId,
			object: site,
			error: errorData instanceof Error ? errorData.message : 'Unknown error',
		});
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function deleteSite(siteId: string): Promise<{ error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.DELETE))) {
			await warn(`Permission denied for site deletion`, {
				type: 'site',
				action: 'delete',
				id: siteId,
				error: 'Forbidden - insufficient permissions',
			});
			return { error: { status: 403, message: 'Forbidden', success: false } };
		}

		const { site } = await getSite(siteId);
		if (!site) {
			await warn(`Site not found for deletion`, {
				type: 'site',
				action: 'delete',
				id: siteId,
				error: 'Site not found',
			});
			return { error: { status: 404, message: 'Site not found', success: false } };
		}

		const infrastructure = Object.values(INFRASTRUCTURES).find((infra) => infra.NAME === site.infrastructure);
		const persistence = infrastructure?.PERSISTENCE;

		if (persistence === INFRASTRUCTURES.KUBERNETES.PERSISTENCE) {
			const { error: kubernetesError } = await deleteKubernetesSite(siteId);
			if (kubernetesError) {
				await error(`Failed to delete site`, {
					type: 'site',
					action: 'delete',
					id: siteId,
					site: site.url,
					error: kubernetesError.message,
				});
				return { error: kubernetesError };
			}

			try {
				await deleteDatabaseSiteExtras(siteId);
				await info(`Site extras deleted successfully for site **${siteId}**`, {
					type: 'site',
					action: 'delete_extras',
					id: siteId,
				});
			} catch (extrasError) {
				console.error(`Error deleting site extras`, extrasError);
			}

			await info(`The **${site.infrastructure}** site **${site.url}** deleted successfully`, {
				type: 'site',
				action: 'delete',
				id: siteId,
				site: site.url,
			});

			await sendSiteDeletedMessage(site.url, site.infrastructure);
		} else if (persistence === INFRASTRUCTURES.EXTERNAL.PERSISTENCE) {
			const { error: databaseError } = await deleteDatabaseSite(siteId);
			if (databaseError) {
				await error(`Failed to delete site`, {
					type: 'site',
					action: 'delete',
					id: siteId,
					site: site.url,
					error: databaseError.message,
				});
				return { error: databaseError };
			}

			await info(`The **${site.infrastructure}** site **${site.url}** deleted successfully`, {
				type: 'site',
				action: 'delete',
				id: siteId,
				site: site.url,
			});

			await sendSiteDeletedMessage(site.url, site.infrastructure);
		}

		return {};
	} catch (errorData) {
		await error(`Failed to delete site`, {
			type: 'site',
			action: 'delete',
			id: siteId,
			error: errorData instanceof Error ? errorData.message : 'Unknown error',
		});
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function getSite(siteId: string): Promise<{ site?: SiteType; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.READ))) {
			await warn(`Permission denied for site read`, {
				type: 'site',
				action: 'read',
				id: siteId,
				error: 'Forbidden - insufficient permissions',
			});
			return { error: { status: 403, message: 'Forbidden', success: false } };
		}

		const { site: kubernetesSite } = await getKubernetesSite(siteId);

		if (kubernetesSite) {
			const { site: dbSite } = await getDatabaseSite(siteId);
			const mergedSite = mergeSiteWithExtras(kubernetesSite, dbSite);

			await info(`The **${mergedSite.infrastructure}** site **${mergedSite.url}** retrieved successfully`, {
				type: 'site',
				action: 'read',
				id: siteId,
			});

			return { site: mergedSite };
		}

		const { site: databaseSite, error: databaseError } = await getDatabaseSite(siteId);
		if (databaseError) {
			await warn(`Site not found`, {
				type: 'site',
				action: 'read',
				id: siteId,
				error: databaseError.message,
			});
			return { error: databaseError };
		}

		if (databaseSite) {
			await info(`The **${databaseSite.infrastructure}** site **${databaseSite.url}** retrieved successfully`, {
				type: 'site',
				action: 'read',
				id: siteId,
			});
		}

		return { site: databaseSite };
	} catch (errorData) {
		await error(`Failed to get site`, {
			type: 'site',
			action: 'read',
			id: siteId,
			error: errorData instanceof Error ? errorData.message : 'Unknown error',
		});
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function listSites(): Promise<{ sites?: SiteType[]; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.LIST))) {
			await warn(`Permission denied for sites listing`, {
				type: 'site',
				action: 'list',
				error: 'Forbidden - insufficient permissions',
			});
			return { error: { status: 403, message: 'Forbidden', success: false } };
		}

		const [kubernetesResult, databaseResult] = await Promise.all([getKubernetesSites(), listDatabaseSites()]);

		const kubernetesSites = kubernetesResult.sites || [];
		const databaseSites = databaseResult.sites || [];

		const databaseSiteMap = new Map(databaseSites.map((site) => [site.id, site]));

		const mergedKubernetesSites = kubernetesSites.map((kubernetesSite) => {
			const dbSite = databaseSiteMap.get(kubernetesSite.id);
			if (dbSite) {
				databaseSiteMap.delete(kubernetesSite.id);
				return mergeSiteWithExtras(kubernetesSite, dbSite);
			}
			return kubernetesSite;
		});

		const remainingDatabaseSites = Array.from(databaseSiteMap.values());
		const allSites = [...mergedKubernetesSites, ...remainingDatabaseSites];

		if (allSites.length === 0) {
			await info(`No sites found`, {
				type: 'site',
				action: 'list',
				count: 0,
			});
			return { error: { status: 404, message: 'No sites found', success: false } };
		}

		await info(`Sites listed successfully`, {
			type: 'site',
			action: 'list',
			count: allSites.length,
			kubernetesCount: kubernetesSites.length,
			databaseCount: databaseSites.length,
		});

		return { sites: allSites };
	} catch (errorData) {
		await error(`Failed to list sites`, {
			type: 'site',
			action: 'list',
			error: errorData instanceof Error ? errorData.message : 'Unknown error',
		});
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function searchSites(url: string): Promise<{ sites?: SearchSiteType[]; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.LIST))) {
			await warn(`Permission denied for sites search`, {
				type: 'site',
				action: 'search',
				url,
				error: 'Forbidden - insufficient permissions',
			});
			return { error: { status: 403, message: 'Forbidden', success: false } };
		}

		const { sites, error: listError } = await listSites();
		if (listError) {
			await error(`Failed to get sites list for search`, {
				type: 'site',
				action: 'search',
				url,
				error: listError.message,
			});
			return { error: listError };
		}

		if (!sites || sites.length === 0) {
			await info(`No sites available for search`, {
				type: 'site',
				action: 'search',
				url,
				count: 0,
			});
			return { error: { status: 404, message: 'No sites found', success: false } };
		}

		const filteredSites = sites
			.filter((site) => {
				try {
					const [siteUrl, searchUrl] = [new URL(site.url), new URL(url)];
					if (siteUrl.hostname !== searchUrl.hostname) return false;

					const [sitePath, searchPath] = [siteUrl.pathname.replace(/\/$/, '') || '/', searchUrl.pathname.replace(/\/$/, '') || '/'];

					return sitePath === searchPath || (searchPath.startsWith(sitePath) && sitePath !== '/');
				} catch (urlError) {
					console.error(`Error parsing URL for site search`, urlError);
					return false;
				}
			})
			.sort((a, b) => b.url.length - a.url.length)
			.slice(0, 1);

		if (filteredSites.length === 0) {
			await info(`No sites found matching the URL`, {
				type: 'site',
				action: 'search',
				url,
				totalSites: sites.length,
			});
			return { error: { status: 404, message: 'No sites found matching the URL', success: false } };
		}

		const searchSites = await Promise.all(
			filteredSites.map(async (site) => {
				try {
					const searchSite: SearchSiteType = {
						id: site.id,
						url: site.url,
						loginUrl: site.url.endsWith('/') ? `${site.url}wp-admin/` : `${site.url}/wp-admin/`,
						unit: await getUnit(site.unitId?.toString() || ''),
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
							editors: await getEditors(site.unitId?.toString() || ''),
							accreditors: ['admin.epfl', 'mediacom.admin'],
						},
					};

					return searchSite;
				} catch (siteError) {
					await warn(`Error processing site for search results`, {
						type: 'site',
						action: 'search',
						url,
						siteId: site.id,
						siteUrl: site.url,
						error: siteError instanceof Error ? siteError.message : 'Unknown error',
					});
					throw siteError;
				}
			})
		);

		await info(`Sites search completed successfully`, {
			type: 'site',
			action: 'search',
			url,
			matchingCount: searchSites.length,
			totalSearched: sites.length,
		});

		return { sites: searchSites };
	} catch (errorData) {
		await error(`Failed to search sites`, {
			type: 'site',
			action: 'search',
			url,
			error: errorData instanceof Error ? errorData.message : 'Unknown error',
		});
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}
