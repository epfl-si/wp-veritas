"use server";
import { getInfrastructureByName } from "@/constants/infrastructures";
import { PERMISSIONS } from "@/constants/permissions";
import { getEditors } from "@/lib/api";
import {
	createDatabaseSite,
	createDatabaseSiteExtras,
	deleteDatabaseSite,
	deleteDatabaseSiteExtras,
	getDatabaseSite,
	listDatabaseSites,
	listKubernetesExtras,
	updateDatabaseSite,
	upsertDatabaseSiteExtras,
} from "@/lib/database";
import { httpError } from "@/lib/errors";
import { createKubernetesSite, deleteKubernetesSite, getKubernetesSite, getKubernetesSiteExtraInfo, getKubernetesSites, updateKubernetesSite } from "@/lib/kubernetes";
import log from "@/lib/log";
import { ensureSlashAtEnd } from "@/lib/utils";
import { disassociateTagFromSite, getTagsBySite } from "@/services/tag";
import type { APIError } from "@/types/error";
import type { ServiceResponse } from "@/types/response";
import {
	createSiteSchema,
	type DatabaseSite,
	getSitePersistence,
	isCreatableInfrastructure,
	isKubernetesSite,
	type KubernetesSite,
	type KubernetesSiteExtraInfo,
	type SearchSite,
	SITE_EXTRA_KEYS,
	type Site,
	type SiteForm,
} from "@/types/site";
import { getPersonsByUsernames, getUnitById } from "./api";
import { hasPermission } from "./policy";
import { sendSiteCreatedMessage, sendSiteDeletedMessage } from "./telegram";

async function getAllSites(): Promise<Site[]> {
	const [{ sites: k8sSites = [] }, { sites: dbSites = [] }, { extras = [] }] = await Promise.all([getKubernetesSites(), listDatabaseSites(), listKubernetesExtras()]);

	const extrasById = new Map(extras.map((e) => [e.id, e]));

	return [
		...dbSites,
		...k8sSites.map((site) => {
			const extra = extrasById.get(site.id);
			if (!extra) return site;
			const { ticket, comment, monitored, responsibles } = extra;
			return { ...site, ticket, comment, monitored, responsibles };
		}),
	];
}

function valuesEqual(a: unknown, b: unknown): boolean {
	if (Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((v, i) => v === b[i]);
	}
	return a === b;
}

function describeChange(field: string, from: unknown, to: unknown): string {
	const label = field.charAt(0).toUpperCase() + field.slice(1);
	const fmt = (v: unknown) => (Array.isArray(v) ? v.join(", ") : String(v ?? ""));

	if (typeof from === "boolean" || typeof to === "boolean") {
		return `the ${field} was ${to ? "enabled" : "disabled"}`;
	}
	if (to && !from) return `${label} was added: '''${fmt(to)}'''`;
	if (!to && from) return `${label} was removed: '''${fmt(from)}'''`;
	return `${label} was changed: '''${fmt(from)} → ${fmt(to)}'''`;
}

const UPDATABLE_FIELDS = ["categories", "languages", "unitId", "title", "tagline", ...SITE_EXTRA_KEYS] as const;

function detectChanges(existing: Site, incoming: SiteForm): Record<string, { from: unknown; to: unknown }> {
	const changes: Record<string, { from: unknown; to: unknown }> = {};
	for (const field of UPDATABLE_FIELDS) {
		const from = field in existing ? existing[field as keyof Site] : undefined;
		const to = field in incoming ? incoming[field as keyof SiteForm] : undefined;
		if (!valuesEqual(from, to)) changes[field] = { from, to };
	}
	return changes;
}

function formatChanges(changes: Record<string, { from: unknown; to: unknown }>): string {
	const messages = Object.entries(changes).map(([field, { from, to }]) => describeChange(field, from, to));
	if (!messages.length) return "";
	const joined = messages.join(", ");
	return `${joined.charAt(0).toUpperCase()}${joined.slice(1)}.`;
}

export async function getSite(siteId: string): Promise<{ site?: Site; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.READ))) {
			await log.warn("Permission denied for site read", { type: "site", action: "read", id: siteId });
			return httpError.forbidden();
		}

		const canReadTags = await hasPermission(PERMISSIONS.TAGS.READ);
		const loadTags = () =>
			canReadTags
				? getTagsBySite(siteId)
						.then((r) => r.tags?.map((t) => t.id) ?? [])
						.catch(() => [])
				: Promise.resolve([]);

		const { site: k8sSite } = await getKubernetesSite(siteId);
		if (k8sSite) {
			const [{ site: dbExtras }, tags] = await Promise.all([getDatabaseSite(siteId), loadTags()]);
			const { ticket, comment, monitored, responsibles } = dbExtras ?? {};
			const site: KubernetesSite = { ...k8sSite, ticket, comment, monitored, responsibles, tags };
			await log.info(`Site ${site.url} (${site.infrastructure}) retrieved.`, { type: "site", action: "read", id: siteId });
			return { site };
		}

		const [{ site: dbSite, error }, tags] = await Promise.all([getDatabaseSite(siteId), loadTags()]);
		if (error) return { error };
		if (dbSite) {
			const site: DatabaseSite = { ...dbSite, tags };
			await log.info(`Site ${site.url} (${site.infrastructure}) retrieved.`, { type: "site", action: "read", id: siteId });
			return { site };
		}

		return httpError.notFound();
	} catch (err) {
		await log.error("Failed to get site", {
			type: "site",
			action: "read",
			id: siteId,
			error: { message: err instanceof Error ? err.message : "Unknown", stack: err instanceof Error ? err.stack : undefined },
		});
		return httpError.internal();
	}
}

export async function listSites(): Promise<{ sites?: Site[]; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.LIST))) {
			await log.warn("Permission denied for sites listing", { type: "site", action: "list" });
			return httpError.forbidden();
		}

		const sites = await getAllSites();
		if (!sites.length) {
			return { error: { status: 404, message: "No sites found", success: false } };
		}

		await log.info(`Listed ${sites.length} sites.`, { type: "site", action: "list", count: sites.length });
		return { sites };
	} catch (err) {
		await log.error("Failed to list sites", { type: "site", action: "list", error: { message: err instanceof Error ? err.message : "Unknown", stack: err instanceof Error ? err.stack : undefined } });
		return httpError.internal();
	}
}

export async function createSite(form: SiteForm): Promise<{ siteId?: string; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.CREATE))) {
			await log.warn("Permission denied for site creation", { type: "site", action: "create", object: form });
			return httpError.forbidden();
		}

		if (!getInfrastructureByName(form.infrastructure)) {
			return { error: { status: 400, message: "Invalid infrastructure", success: false } };
		}

		if (!isCreatableInfrastructure(form.infrastructure)) {
			return { error: { status: 400, message: "Infrastructure is not creatable", success: false } };
		}

		const { sites } = await listSites();
		if (sites?.some((s) => s.url === ensureSlashAtEnd(form.url))) {
			return { error: { status: 409, message: "Site already exists", success: false } };
		}

		const persistence = getSitePersistence(form.infrastructure);

		if (persistence === "kubernetes") {
			const { siteId, error } = await createKubernetesSite(form);
			if (error) {
				await log.error("Failed to create site", { type: "site", action: "create", object: form, error: { message: error.message } });
				return { error };
			}
			if (siteId) {
				const { ticket, comment, monitored, responsibles } = form;
				if (ticket !== undefined || comment !== undefined || monitored !== undefined || responsibles?.length) {
					await createDatabaseSiteExtras(siteId, { ticket, comment, monitored, responsibles });
				}
				await log.info(`Site ${form.url} (${form.infrastructure}) created.`, { type: "site", action: "create", id: siteId });
			}
			await sendSiteCreatedMessage(form.url, form.infrastructure);
			return { siteId };
		}

		if (persistence === "database") {
			const { siteId, error } = await createDatabaseSite(form);
			if (error) {
				await log.error("Failed to create site", { type: "site", action: "create", object: form, error: { message: error.message } });
				return { error };
			}
			if (siteId) {
				await log.info(`Site ${form.url} (${form.infrastructure}) created.`, { type: "site", action: "create", id: siteId });
			}
			await sendSiteCreatedMessage(form.url, form.infrastructure);
			return { siteId };
		}

		await log.warn("Unsupported persistence type", { type: "site", action: "create", object: form });
		return { error: { status: 501, message: "Not implemented", success: false } };
	} catch (err) {
		await log.error("Failed to create site", {
			type: "site",
			action: "create",
			object: form,
			error: { message: err instanceof Error ? err.message : "Unknown", stack: err instanceof Error ? err.stack : undefined },
		});
		return httpError.internal();
	}
}

export async function updateSite(siteId: string, form: SiteForm): Promise<{ error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.UPDATE))) {
			await log.warn("Permission denied to update the site", { type: "site", action: "update", id: siteId });
			return httpError.forbidden();
		}

		const { site: existing, error: fetchError } = await getSite(siteId);
		if (!existing) return fetchError ? { error: fetchError } : httpError.notFound();

		const persistence = getSitePersistence(form.infrastructure);
		const changes = detectChanges(existing, form);

		if (persistence === "database") {
			if (!Object.keys(changes).length) {
				await log.info(`No changes for site ${existing.url}.`, { type: "site", action: "update", id: siteId, result: "no_changes" });
				return {};
			}
			const { error } = await updateDatabaseSite(siteId, form);
			if (error) {
				await log.error(`Failed to update site ${form.url}.`, { type: "site", action: "update", id: siteId, error: { message: error.message } });
				return { error };
			}
			await log.info(`Site ${form.url} updated. ${formatChanges(changes)}`, { type: "site", action: "update", id: siteId, changes });
			return {};
		}

		if (persistence === "kubernetes") {
			const { error: k8sError } = await updateKubernetesSite(siteId, form);
			if (k8sError) {
				await log.error(`Failed to update site ${form.url}.`, { type: "site", action: "update", id: siteId, error: { message: k8sError.message } });
				return { error: k8sError };
			}
			try {
				const { ticket, comment, monitored, responsibles } = form;
				await upsertDatabaseSiteExtras(siteId, { ticket, comment, monitored, responsibles });
			} catch {
				await log.warn(`Failed to update extras for ${form.url}.`, { type: "site", action: "update_extras", id: siteId });
			}
			if (Object.keys(changes).length) {
				await log.info(`Site ${form.url} updated. ${formatChanges(changes)}`, { type: "site", action: "update", id: siteId, changes });
			}
			return {};
		}

		return { error: { status: 400, message: "Bad Request", success: false } };
	} catch (err) {
		await log.error("Failed to update site", {
			type: "site",
			action: "update",
			id: siteId,
			error: { message: err instanceof Error ? err.message : "Unknown", stack: err instanceof Error ? err.stack : undefined },
		});
		return httpError.internal();
	}
}

export async function deleteSite(siteId: string): Promise<{ error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.DELETE))) {
			await log.warn("Permission denied for site deletion", { type: "site", action: "delete", id: siteId });
			return httpError.forbidden();
		}

		const { site, error: fetchError } = await getSite(siteId);
		if (!site) return fetchError ? { error: fetchError } : httpError.notFound();

		const { tags, error: tagError } = await getTagsBySite(siteId);
		if (tagError) return { error: tagError };
		if (tags?.length) {
			await Promise.all(tags.map((tag) => disassociateTagFromSite(tag.id, siteId)));
		}

		const persistence = getSitePersistence(site.infrastructure);

		if (persistence === "kubernetes") {
			const { error } = await deleteKubernetesSite(siteId);
			if (error) {
				await log.error("Failed to delete site", { type: "site", action: "delete", id: siteId, url: site.url, error: { message: error.message } });
				return { error };
			}
			try {
				await deleteDatabaseSiteExtras(siteId);
			} catch {
				/* extras are optional */
			}
			await log.info(`Site ${site.url} (${site.infrastructure}) deleted.`, { type: "site", action: "delete", id: siteId });
			await sendSiteDeletedMessage(site.url, site.infrastructure);
			return {};
		}

		if (persistence === "database") {
			const { error } = await deleteDatabaseSite(siteId);
			if (error) {
				await log.error("Failed to delete site", { type: "site", action: "delete", id: siteId, url: site.url, error: { message: error.message } });
				return { error };
			}
			await log.info(`Site ${site.url} (${site.infrastructure}) deleted.`, { type: "site", action: "delete", id: siteId });
			await sendSiteDeletedMessage(site.url, site.infrastructure);
			return {};
		}

		return { error: { status: 501, message: "Cannot delete sites with no persistence", success: false } };
	} catch (err) {
		await log.error("Failed to delete site", {
			type: "site",
			action: "delete",
			id: siteId,
			error: { message: err instanceof Error ? err.message : "Unknown", stack: err instanceof Error ? err.stack : undefined },
		});
		return httpError.internal();
	}
}

export async function searchSites(url: string): Promise<{ sites?: SearchSite[]; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.SITES.SEARCH))) {
			return httpError.forbidden();
		}

		let normalizedUrl = url.trim();
		if (!normalizedUrl.match(/^https?:\/\//i)) normalizedUrl = `https://${normalizedUrl}`;

		const urlNotFound = await fetch(normalizedUrl, { method: "HEAD" })
			.then((r) => r.status === 404)
			.catch(() => false);

		const allSites = await getAllSites();

		const matched = allSites
			.filter((site) => {
				try {
					const siteUrl = new URL(site.url);
					const searchUrl = new URL(normalizedUrl);
					if (siteUrl.hostname !== searchUrl.hostname) return false;
					const sitePath = siteUrl.pathname.replace(/\/$/, "") || "/";
					const searchPath = searchUrl.pathname.replace(/\/$/, "") || "/";
					return sitePath === searchPath || searchPath.startsWith(`${sitePath}/`) || sitePath === "/";
				} catch {
					return false;
				}
			})
			.filter(isKubernetesSite)
			.sort((a, b) => {
				const aPath = new URL(a.url).pathname.replace(/\/$/, "") || "/";
				const bPath = new URL(b.url).pathname.replace(/\/$/, "") || "/";
				return bPath.length - aPath.length;
			})
			.slice(0, 1);

		if (!matched.length) {
			return { error: { status: 404, message: "No sites found matching the URL", success: false } };
		}

		const fetchWpData = async (endpoint: string, siteUrl: string) => {
			try {
				const res = await fetch(`${siteUrl}wp-json/epfl/v1/${endpoint}`);
				if (res.status === 404) return null;
				const data = await res.json();
				return data?.data?.status === 404 || (Array.isArray(data) && !data.length) ? null : data;
			} catch {
				return null;
			}
		};

		type Revision = { username: string; last_modified: string; post_title?: string; post_url?: string };

		const sites = await Promise.all(
			matched.map(async (site) => {
				const [revisions, lastChange] = await Promise.all([fetchWpData("lastrevisions", site.url), fetchWpData(`lastchange?url=${normalizedUrl}`, site.url)]);

				const userIds = [...(revisions?.map((r: Revision) => r.username) ?? []), ...(lastChange?.[0]?.username ? [lastChange[0].username] : [])];
				const persons = await getPersonsByUsernames(userIds).then((res) => (res.success ? res.data : []));

				let kubernetesExtraInfo: KubernetesSiteExtraInfo | undefined;
				try {
					kubernetesExtraInfo = await getKubernetesSiteExtraInfo(site.id);
				} catch {
					// extra info is optional
				}

				const loginUrl = site.url.endsWith("/") ? `${site.url}wp-admin/` : `${site.url}/wp-admin/`;
				const unit = await getUnitById(site.unitId.toString()).then((res) => (res.success ? res.data : null));

				return {
					id: site.id,
					url: site.url,
					loginUrl,
					infrastructure: site.infrastructure,
					unit,
					lastModified: lastChange?.[0]?.last_modified
						? {
								date: lastChange[0].last_modified,
								user: persons.find((p) => p.id === lastChange[0].username)?.name ?? lastChange[0].username,
							}
						: null,
					recentModifications:
						revisions?.slice(0, 5).map((r: Revision) => ({
							date: r.last_modified,
							user: persons.find((p) => p.id === r.username)?.name ?? r.username,
							page: r.post_title ?? "page non disponible",
							available: Boolean(r.post_title && r.post_url),
						})) ?? [],
					permissions: {
						editors: await getEditors(site.unitId.toString()),
						accreditors: ["admin.epfl", "mediacom.admin"],
					},
					...(kubernetesExtraInfo && { kubernetesExtraInfo }),
					urlNotFound,
					searchedUrl: normalizedUrl,
				} satisfies SearchSite;
			}),
		);

		await log.info("Sites search completed", { type: "site", action: "search", url, count: sites.length });
		return { sites };
	} catch (err) {
		await log.error("Failed to search sites", {
			type: "site",
			action: "search",
			url,
			error: { message: err instanceof Error ? err.message : "Unknown", stack: err instanceof Error ? err.stack : undefined },
		});
		return httpError.internal();
	}
}

// --- Server Actions (called from form submissions) ---

export const createSiteAction = async (form: SiteForm): Promise<ServiceResponse<{ siteId: string }>> => {
	try {
		const schema = await createSiteSchema();
		const parsed = await schema.safeParseAsync(form);
		if (!parsed.success) return { success: false, error: "Invalid data", code: "VALIDATION_ERROR" };
		const { siteId, error } = await createSite(parsed.data);
		if (error)
			return {
				success: false,
				error: error.message,
				code:
					error.status === 401
						? "UNAUTHORIZED"
						: error.status === 403
							? "FORBIDDEN"
							: error.status === 404
								? "NOT_FOUND"
								: error.status === 409
									? "CONFLICT"
									: error.status >= 500
										? "INTERNAL"
										: "UNKNOWN",
			};
		if (!siteId) return { success: false, error: "Unknown error", code: "UNKNOWN" };
		return { success: true, data: { siteId } };
	} catch {
		return { success: false, error: "Unknown error", code: "UNKNOWN" };
	}
};

export const updateSiteAction = async (siteId: string, form: SiteForm): Promise<ServiceResponse<{ siteId: string }>> => {
	try {
		const schema = await createSiteSchema();
		const parsed = await schema.safeParseAsync(form);
		if (!parsed.success) return { success: false, error: "Invalid data", code: "VALIDATION_ERROR" };
		const { error } = await updateSite(siteId, parsed.data);
		if (error)
			return {
				success: false,
				error: error.message,
				code:
					error.status === 401
						? "UNAUTHORIZED"
						: error.status === 403
							? "FORBIDDEN"
							: error.status === 404
								? "NOT_FOUND"
								: error.status === 409
									? "CONFLICT"
									: error.status >= 500
										? "INTERNAL"
										: "UNKNOWN",
			};
		return { success: true, data: { siteId } };
	} catch {
		return { success: false, error: "Unknown error", code: "UNKNOWN" };
	}
};

export const deleteSiteAction = async (siteId: string): Promise<void> => {
	const { error } = await deleteSite(siteId);
	if (error) throw new Error(error.message);
};
