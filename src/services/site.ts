"use server";
import { APIError } from "@/types/error";
import { SearchSiteType, SiteFormType, SiteType, KubernetesSite, DatabaseSite, isKubernetesSite, isDatabaseSite, getSitePersistence, isCreatableInfrastructure, SiteExtras, SITE_EXTRAS } from "@/types/site";
import { hasPermission } from "./policy";
import { PERMISSIONS } from "@/constants/permissions";
import { getEditors, getNames, getUnit } from "@/lib/api";
import { getInfrastructureByName } from "@/constants/infrastructures";
import { createKubernetesSite, getKubernetesSite, getKubernetesSites, updateKubernetesSite, deleteKubernetesSite, getKubernetesSiteExtraInfo } from "@/lib/kubernetes";
import { createDatabaseSite, listDatabaseSites, getDatabaseSite, updateDatabaseSite, deleteDatabaseSite, createDatabaseSiteExtras, updateDatabaseSiteExtras, deleteDatabaseSiteExtras } from "@/lib/database";
import { disassociateTagFromSite, getTagsBySite } from "@/services/tag";
import { info, warn, error } from "@/lib/log";
import { ensureSlashAtEnd } from "@/lib/utils";
import { sendSiteCreatedMessage, sendSiteDeletedMessage } from "./telegram";

function extractExtras(site: SiteFormType): SiteExtras {
	const extras: { [key: string]: unknown } = {};

	SITE_EXTRAS.forEach((extra: string) => {
		if (extra in site) {
			extras[extra] = site[extra as keyof SiteFormType];
		}
	});

	return extras as SiteExtras;
}

function mergeSiteWithExtras(kubernetesSite: KubernetesSite, dbSite?: DatabaseSite): KubernetesSite {
	return {
		...kubernetesSite,
		ticket: dbSite?.ticket,
		comment: dbSite?.comment,
		monitored: dbSite?.monitored,
	};
}

async function enrichSiteWithTags(site: SiteType): Promise<SiteType> {
	try {
		if (await hasPermission(PERMISSIONS.TAGS.READ)) {
			const { tags } = await getTagsBySite(site.id);
			return {
				...site,
				tags: tags?.map((tag) => tag.id) || [],
			};
		}
	} catch (tagError) {
		console.warn(`Failed to load tags for site ${site.id}.`, tagError);
	}

	return site;
}

export async function createSite(site: SiteFormType): Promise<{ siteId?: string; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.CREATE))) {
			await warn("Permission denied for site creation.", {
				type: "site",
				action: "create",
				object: site,
				error: "Forbidden - insufficient permissions",
			});
			return { error: { status: 403, message: "Forbidden", success: false } };
		}

		const infrastructure = getInfrastructureByName(site.infrastructure);
		if (!infrastructure) {
			return { error: { status: 400, message: "Invalid infrastructure", success: false } };
		}

		if (!isCreatableInfrastructure(site.infrastructure)) {
			return { error: { status: 400, message: "Infrastructure is not creatable", success: false } };
		}

		const { sites } = await listSites();
		const siteUrl = ensureSlashAtEnd(site.url);
		if (sites && sites.some((s) => s.url === siteUrl)) {
			return { error: { status: 409, message: "Site already exists", success: false } };
		}

		const persistence = getSitePersistence(site.infrastructure);

		switch (persistence) {
			case "kubernetes": {
				const { siteId, error: kubernetesError } = await createKubernetesSite(site);
				if (kubernetesError) {
					console.error("Error creating Kubernetes site.", kubernetesError);
					await error("Failed to create site.", {
						type: "site",
						action: "create",
						object: site,
						error: kubernetesError.message,
					});
					return { error: kubernetesError };
				}

				if (siteId) {
					const extras = extractExtras(site);
					if (Object.keys(extras).length > 0) {
						await createDatabaseSiteExtras(siteId, extras);
					}

					await info(`The site ${site.url} (${site.infrastructure}) created successfully.`, {
						type: "site",
						action: "create",
						id: siteId,
						object: site,
					});
				}

				await sendSiteCreatedMessage(site.url, site.infrastructure);
				return { siteId };
			}

			case "database": {
				const { siteId, error: databaseError } = await createDatabaseSite(site);
				if (databaseError) {
					await error("Failed to create site.", {
						type: "site",
						action: "create",
						object: site,
						error: databaseError.message,
					});
					return { error: databaseError };
				}

				if (siteId) {
					await info(`The site ${site.url} (${site.infrastructure}) created successfully.`, {
						type: "site",
						action: "create",
						id: siteId,
						object: site,
					});
				}

				await sendSiteCreatedMessage(site.url, site.infrastructure);
				return { siteId };
			}

			case "none":
			default:
				await warn("Unsupported persistence type for site creation.", {
					type: "site",
					action: "create",
					object: site,
					persistence,
					error: "Not implemented",
				});
				return { error: { status: 501, message: "Not implemented", success: false } };
		}
	} catch (errorData) {
		await error("Failed to create site.", {
			type: "site",
			action: "create",
			object: site,
			error: errorData instanceof Error ? errorData.stack : "Unknown error",
		});
		console.error("Error creating site.", errorData);
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function updateSite(siteId: string, site: SiteFormType): Promise<{ error?: APIError }> {
	try {
		const UPDATABLE_FIELDS = ["categories", "languages", "unitId", ...SITE_EXTRAS];

		if (!(await hasPermission(PERMISSIONS.SITES.UPDATE))) {
			await warn("Permission denied to update the site.", {
				type: "site",
				action: "update",
				id: siteId,
				object: site,
				error: "Forbidden - insufficient permissions",
			});
			return { error: { status: 403, message: "Forbidden", success: false } };
		}

		const { site: existingSite, error: fetchError } = await getSite(siteId);
		if (fetchError || !existingSite) {
			await error("Could not retrieve the site to update.", {
				type: "site",
				action: "update",
				id: siteId,
				error: fetchError?.message || "Site not found",
			});
			return { error: fetchError || { status: 404, message: "Site not found", success: false } };
		}

		const immutableFieldsChanged: string[] = [];
		for (const [key, value] of Object.entries(site)) {
			if (!UPDATABLE_FIELDS.includes(key) && existingSite.hasOwnProperty(key)) {
				const existingValue = existingSite[key as keyof typeof existingSite];

				if (Array.isArray(value) && Array.isArray(existingValue)) {
					if (value.length !== existingValue.length ||
						!value.every((item, index) => item === existingValue[index])) {
						immutableFieldsChanged.push(key);
					}
				} else if (existingValue !== value) {
					immutableFieldsChanged.push(key);
				}
			}
		}

		const persistence = getSitePersistence(site.infrastructure);
		const changes: string[] = [];
		const changeDetails: Record<string, { from: unknown; to: unknown }> = {};

		for (const field of UPDATABLE_FIELDS) {
			if (field in site && field in existingSite) {
				const newValue = site[field as keyof SiteFormType];
				const existingValue = existingSite[field as keyof typeof existingSite];
				let hasChanged = false;
				if (Array.isArray(newValue) && Array.isArray(existingValue)) {
					const newSet = new Set(newValue);
					const existingSet = new Set(existingValue);

					hasChanged = newSet.size !== existingSet.size ||
						![...newSet].every(item => existingSet.has(item));
				} else {
					hasChanged = newValue !== existingValue;
				}

				if (hasChanged) {
					const generateChangeMessage = (fieldName: string, oldVal: string | boolean | string[] | Date | undefined, newVal: string | string[] | boolean | number | undefined): string => {
						const article = ["a", "e", "i", "o", "u"].includes(fieldName.toLowerCase()[0]) ? "an" : "a";

						const formatValue = (val: string | boolean | string[] | Date | undefined | number): string => {
							if (Array.isArray(val)) {
								return val.join(", ");
							}
							return String(val);
						};

						if (typeof oldVal === "boolean" || typeof newVal === "boolean") {
							if (newVal === true && oldVal === false) {
								return `the ${fieldName.toLowerCase()} was enabled`;
							} else if (newVal === false && oldVal === true) {
								return `the ${fieldName.toLowerCase()} was disabled`;
							} else if (newVal === true && (oldVal === undefined || oldVal === null)) {
								return `the ${fieldName.toLowerCase()} was enabled`;
							} else if (newVal === false && (oldVal === undefined || oldVal === null)) {
								return `the ${fieldName.toLowerCase()} was disabled`;
							} else if ((newVal === undefined || newVal === null) && oldVal === true) {
								return `the ${fieldName.toLowerCase()} was disabled`;
							} else if ((newVal === undefined || newVal === null) && oldVal === false) {
								return `the ${fieldName.toLowerCase()} was removed`;
							}
						}

						if (newVal && !oldVal) {
							return `${article} ${fieldName.toLowerCase()} was added: '''${formatValue(newVal)}'''`;
						} else if (!newVal && oldVal) {
							return `the ${fieldName.toLowerCase()} was removed: '''${formatValue(oldVal)}'''`;
						} else {
							return `the ${fieldName.toLowerCase()} was changed: '''${formatValue(oldVal)} → ${formatValue(newVal)}'''`;
						}
					};

					if (field === "categories" && site.infrastructure === "Kubernetes") {
						const oldCategories = existingValue as string[] || [];
						const newCategories = (newValue || []) as string[];

						const added = newCategories.filter((c: string) => !oldCategories.includes(c));
						const removed = oldCategories.filter((c: string) => !newCategories.includes(c));

						if (added.length > 0) {
							changes.push(`some categories were added: '''${added.join(", ")}'''`);
						}
						if (removed.length > 0) {
							changes.push(`some categories were removed: '''${removed.join(", ")}'''`);
						}
					} else {

						const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
						changes.push(generateChangeMessage(fieldName, existingValue, newValue));
					}

					changeDetails[field] = { from: existingValue, to: newValue };
				}
			}
		}

		if (changes.length === 0) {
			await info(`No changes were detected for the site ${existingSite.url}.`, {
				type: "site",
				action: "update",
				id: siteId,
				result: "no_changes",
			});
			return {};
		}

		switch (persistence) {
			case "database": {
				const { error: databaseError } = await updateDatabaseSite(siteId, site);
				if (databaseError) {
					await error(`Failed to update the site ${site.url}.`, {
						type: "site",
						action: "update",
						id: siteId,
						object: site,
						changes: changeDetails,
						error: databaseError.message,
					});
					return { error: databaseError };
				}

				await info(`The site ${site.url} (${site.infrastructure}) was updated. ${changes.join(", ").replace(/^./, c => c.toUpperCase())}.`, {
					type: "site",
					action: "update",
					id: siteId,
					changes: changeDetails,
				});
				break;
			}

			case "kubernetes": {
				const { error: kubernetesError } = await updateKubernetesSite(siteId, site);
				if (kubernetesError) {
					await error(`Failed to update the site ${site.url}.`, {
						type: "site",
						action: "update",
						id: siteId,
						object: site,
						changes: changeDetails,
						error: kubernetesError.message,
					});
					return { error: kubernetesError };
				}

				const extras = extractExtras(site);
				if (Object.keys(extras).length > 0) {
					try {
						await updateDatabaseSiteExtras(siteId, extras);
					} catch (extrasError) {
						console.error(`Error updating site extras for ${siteId}:`, extrasError);
						await warn(`The extras could not be updated but the site update succeeded: ${site.url}.`, {
							type: "site",
							action: "update_extras",
							id: siteId,
							error: extrasError instanceof Error ? extrasError.message : "Unknown error",
						});
					}
				}

				await info(`Site ${site.url} (${site.infrastructure}) updated: ${changes.join(", ").replace(/^./, c => c.toUpperCase())}.`, {
					type: "site",
					action: "update",
					id: siteId,
					changes: changeDetails,
				});
				break;
			}

			case "none":
			default:
				await warn(`This type of site cannot be updated: ${site.url}.`, {
					type: "site",
					action: "update",
					id: siteId,
					object: site,
					persistence,
					error: "Not implemented",
				});
				return { error: { status: 400, message: "Bad Request", success: false } };
		}

		return {};
	} catch (errorData) {
		await error(`The site could not be updated due to an error: ${site.url}.`, {
			type: "site",
			action: "update",
			id: siteId,
			object: site,
			error: errorData instanceof Error ? errorData.stack : "Unknown error",
		});
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function deleteSite(siteId: string): Promise<{ error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.DELETE))) {
			await warn("Permission denied for site deletion", {
				type: "site",
				action: "delete",
				id: siteId,
				error: "Forbidden - insufficient permissions",
			});
			return { error: { status: 403, message: "Forbidden", success: false } };
		}

		const { site } = await getSite(siteId);
		if (!site) {
			await warn("Site not found for deletion", {
				type: "site",
				action: "delete",
				id: siteId,
				error: "Site not found",
			});
			return { error: { status: 404, message: "Site not found", success: false } };
		}

		const persistence = getSitePersistence(site.infrastructure);

		const { tags, error: tagError } = await getTagsBySite(siteId);
		if (tagError) return { error: tagError };

		if (tags && tags.length > 0) {
			await Promise.all(
				tags.map(async (tag) => {
					await disassociateTagFromSite(tag.id, siteId);
				}),
			);
		}

		switch (persistence) {
			case "kubernetes": {
				const { error: kubernetesError } = await deleteKubernetesSite(siteId);
				if (kubernetesError) {
					await error("Failed to delete site", {
						type: "site",
						action: "delete",
						id: siteId,
						site: site.url,
						error: kubernetesError.message,
					});
					return { error: kubernetesError };
				}

				try {
					await deleteDatabaseSiteExtras(siteId);
				} catch (extrasError) {
					console.error("Error deleting site extras", extrasError);
				}

				await info(`The site ${site.url} (${site.infrastructure}) deleted successfully.`, {
					type: "site",
					action: "delete",
					id: siteId,
					site: site.url,
				});

				await sendSiteDeletedMessage(site.url, site.infrastructure);
				break;
			}

			case "database": {
				const { error: databaseError } = await deleteDatabaseSite(siteId);
				if (databaseError) {
					await error("Failed to delete site", {
						type: "site",
						action: "delete",
						id: siteId,
						site: site.url,
						error: databaseError.message,
					});
					return { error: databaseError };
				}

				await info(`The site ${site.url} (${site.infrastructure}) deleted successfully.`, {
					type: "site",
					action: "delete",
					id: siteId,
					site: site.url,
				});

				await sendSiteDeletedMessage(site.url, site.infrastructure);
				break;
			}

			case "none":
			default:
				return { error: { status: 501, message: "Cannot delete sites with no persistence", success: false } };
		}

		return {};
	} catch (errorData) {
		await error("Failed to delete site", {
			type: "site",
			action: "delete",
			id: siteId,
			error: errorData instanceof Error ? errorData.stack : "Unknown error",
		});
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function getSite(siteId: string): Promise<{ site?: SiteType; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.READ))) {
			await warn("Permission denied for site read", {
				type: "site",
				action: "read",
				id: siteId,
				error: "Forbidden - insufficient permissions",
			});
			return { error: { status: 403, message: "Forbidden", success: false } };
		}

		const { site: kubernetesSite } = await getKubernetesSite(siteId);

		if (kubernetesSite && isKubernetesSite(kubernetesSite)) {
			const { site: dbSite } = await getDatabaseSite(siteId);
			const mergedSite = mergeSiteWithExtras(kubernetesSite, dbSite as DatabaseSite);
			const enrichedSite = await enrichSiteWithTags(mergedSite);

			await info(`The ${enrichedSite.infrastructure} site ${enrichedSite.url} retrieved successfully.`, {
				type: "site",
				action: "read",
				id: siteId,
				infrastructure: enrichedSite.infrastructure,
			});

			return { site: enrichedSite };
		}

		const { site: databaseSite, error: databaseError } = await getDatabaseSite(siteId);
		if (databaseError) {
			await warn("Site not found", {
				type: "site",
				action: "read",
				id: siteId,
				error: databaseError.message,
			});
			return { error: databaseError };
		}

		if (databaseSite) {
			const enrichedSite = await enrichSiteWithTags(databaseSite);

			await info(`The ${enrichedSite.infrastructure} site ${enrichedSite.url} retrieved successfully.`, {
				type: "site",
				action: "read",
				id: siteId,
			});

			return { site: enrichedSite };
		}

		return { error: { status: 404, message: "Site not found", success: false } };
	} catch (errorData) {
		await error("Failed to get site", {
			type: "site",
			action: "read",
			id: siteId,
			error: errorData instanceof Error ? errorData.stack : "Unknown error",
		});
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function listSites(): Promise<{ sites?: SiteType[]; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.LIST))) {
			await warn("Permission denied for sites listing", {
				type: "site",
				action: "list",
				error: "Forbidden - insufficient permissions",
			});
			return { error: { status: 403, message: "Forbidden", success: false } };
		}

		const [kubernetesResult, databaseResult] = await Promise.all([getKubernetesSites(), listDatabaseSites()]);

		const kubernetesSites = kubernetesResult.sites || [];
		const databaseSites = databaseResult.sites || [];

		const siteMap = new Map<string, SiteType>();

		databaseSites.forEach((site) => {
			if (isDatabaseSite(site)) {
				siteMap.set(site.id, site);
			}
		});

		kubernetesSites.forEach((kubernetesSite) => {
			if (isKubernetesSite(kubernetesSite)) {
				const dbSite = siteMap.get(kubernetesSite.id);
				const mergedSite = dbSite && isDatabaseSite(dbSite) ? mergeSiteWithExtras(kubernetesSite, dbSite) : kubernetesSite;
				siteMap.set(kubernetesSite.id, mergedSite);
			}
		});

		const allSites = Array.from(siteMap.values());

		if (allSites.length === 0) {
			await info("No sites found", {
				type: "site",
				action: "list",
				count: 0,
			});
			return { error: { status: 404, message: "No sites found", success: false } };
		}

		await info("Sites listed successfully", {
			type: "site",
			action: "list",
			count: allSites.length,
			kubernetesCount: kubernetesSites.length,
			databaseCount: databaseSites.length,
		});

		return { sites: allSites };
	} catch (errorData) {
		await error("Failed to list sites", {
			type: "site",
			action: "list",
			error: errorData instanceof Error ? errorData.stack : "Unknown error",
		});
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function searchSites(url: string): Promise<{ sites?: SearchSiteType[]; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.SEARCH))) {
			return { error: { status: 403, message: "Forbidden", success: false } };
		}

		const [kubernetesResult, databaseResult] = await Promise.all([getKubernetesSites(), listDatabaseSites()]);

		const kubernetesSites = kubernetesResult.sites || [];
		const databaseSites = databaseResult.sites || [];

		const siteMap = new Map<string, SiteType>();

		databaseSites.forEach((site) => {
			if (isDatabaseSite(site)) {
				siteMap.set(site.id, site);
			}
		});

		kubernetesSites.forEach((kubernetesSite) => {
			if (isKubernetesSite(kubernetesSite)) {
				const dbSite = siteMap.get(kubernetesSite.id);
				const mergedSite = dbSite && isDatabaseSite(dbSite) ? mergeSiteWithExtras(kubernetesSite, dbSite) : kubernetesSite;
				siteMap.set(kubernetesSite.id, mergedSite);
			}
		});

		const sites = Array.from(siteMap.values());

		if (!sites?.length) {
			return { error: { status: 404, message: "No sites found", success: false } };
		}

		const filteredSites = sites
			.filter((site) => {
				try {
					const [siteUrl, searchUrl] = [new URL(site.url), new URL(url)];
					if (siteUrl.hostname !== searchUrl.hostname) return false;
					const [sitePath, searchPath] = [siteUrl.pathname.replace(/\/$/, "") || "/", searchUrl.pathname.replace(/\/$/, "") || "/"];
					return sitePath === searchPath || searchPath.startsWith(sitePath + "/") || (sitePath === "/" && searchPath.startsWith("/"));
				} catch {
					return false;
				}
			})
			.sort((a, b) => {
				const aPath = new URL(a.url).pathname.replace(/\/$/, "") || "/";
				const bPath = new URL(b.url).pathname.replace(/\/$/, "") || "/";
				return bPath.length - aPath.length;
			}).slice(0, 1);

		if (!filteredSites.length) {
			return { error: { status: 404, message: "No sites found matching the URL", success: false } };
		}

		const fetchWpData = async (endpoint: string, siteUrl: string) => {
			try {
				const response = await fetch(`${siteUrl}wp-json/epfl/v1/${endpoint}`);
				if (response.status === 404) return null;
				const data = await response.json();
				return data?.data?.status === 404 || (Array.isArray(data) && !data.length) ? null : data;
			} catch {
				return null;
			}
		};

		const searchSites = await Promise.all(
			filteredSites.map(async (site) => {
				const [revisions, lastChange] = await Promise.all([fetchWpData("lastrevisions", site.url), fetchWpData(`lastchange?url=${url}`, site.url)]);

				type Revision = { username: string; last_modified: string; post_title?: string; post_url?: string };
				const userIds = [...(revisions?.map((r: Revision) => r.username).filter(Boolean) || []), ...(lastChange?.[0]?.username ? [lastChange[0].username] : [])];
				const names = userIds.length ? await getNames([...new Set(userIds)], "username") : [];
				const nameMap = new Map(names.map((n) => [n.userId, n.name]));

				let unitId = "0";
				if (isKubernetesSite(site)) {
					unitId = site.unitId?.toString() || "0";
				}

				let kubernetesExtraInfo;
				if (isKubernetesSite(site)) {
					try {
						kubernetesExtraInfo = await getKubernetesSiteExtraInfo(site.id);
					} catch (error) {
						console.warn("Failed to fetch Kubernetes extra info:", error);
					}
				}

				return {
					id: site.id,
					url: site.url,
					loginUrl: site.url.endsWith("/") ? `${site.url}wp-admin/` : `${site.url}/wp-admin/`,
					infrastructure: site.infrastructure,
					unit: await getUnit(unitId),
					lastModified: lastChange?.[0]?.last_modified
						? {
							date: lastChange?.[0]?.last_modified || "",
							user: nameMap.get(lastChange?.[0]?.username) || lastChange?.[0]?.username || "",
						}
						: null,
					recentModifications:
						revisions?.slice(0, 5).map((r: Revision) => ({
							date: r.last_modified,
							user: nameMap.get(r.username) || r.username,
							page: r.post_title || "page non disponible",
							available: Boolean(r.post_title && r.post_url),
						})) || [],
					permissions: {
						editors: await getEditors(unitId),
						accreditors: ["admin.epfl", "mediacom.admin"],
					},
					...(kubernetesExtraInfo && { kubernetesExtraInfo }),
				};
			}),
		);

		return { sites: searchSites };
	} catch (errorData) {
		console.error("Error searching sites:", errorData);
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}
