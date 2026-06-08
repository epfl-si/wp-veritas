import { v4 as uuid } from "uuid";
import { getInfrastructuresByPersistence, INFRASTRUCTURES } from "@/constants/infrastructures";
import { cache, withCache } from "@/lib/redis";
import { SiteModel } from "@/models/Site";
import type { APIError } from "@/types/error";
import type { DatabaseSite, DatabaseSiteForm, SiteExtras, SiteForm } from "@/types/site";
import { httpError } from "./errors";
import { getKubernetesSite } from "./kubernetes";
import log from "./log";
import db from "./mongo";
import { ensureSlashAtEnd } from "./utils";

// biome-ignore lint/suspicious/noExplicitAny: Mongoose lean() returns an untyped document
function toDbSite(doc: any): DatabaseSite {
	return {
		id: doc.id,
		url: ensureSlashAtEnd(doc.url),
		infrastructure: doc.infrastructure as DatabaseSite["infrastructure"],
		createdAt: doc.createdAt ?? new Date(),
		tags: [],
		title: doc.title,
		tagline: doc.tagline,
		ticket: doc.ticket,
		comment: doc.comment,
		monitored: doc.monitored,
		responsibles: doc.responsibles,
		managed: true,
	};
}

// biome-ignore lint/suspicious/noExplicitAny: Mongoose lean() returns an untyped document
function toExtras(doc: any): { id: string } & SiteExtras {
	return {
		id: doc.id,
		ticket: doc.ticket,
		comment: doc.comment,
		monitored: doc.monitored,
		responsibles: doc.responsibles,
	};
}

export async function getDatabaseSite(id: string): Promise<{ site?: DatabaseSite; error?: APIError }> {
	try {
		await db.connect();
		const doc = await SiteModel.findOne({ id });
		if (!doc) return httpError.notFound("Site not found");
		return { site: toDbSite(doc) };
	} catch (err) {
		void log.error("Error fetching database site", { type: "site", action: "read", id, error: { message: err instanceof Error ? err.message : String(err) } });
		return httpError.internal();
	}
}

export async function listDatabaseSites(): Promise<{ sites?: DatabaseSite[]; error?: APIError }> {
	return withCache(
		"database-sites",
		async () => {
			try {
				await db.connect();
				const dbInfras = getInfrastructuresByPersistence("database").map((i) => i.NAME);
				const docs = await SiteModel.find({ infrastructure: { $in: dbInfras } })
					.select("id url infrastructure title tagline createdAt ticket comment monitored responsibles")
					.sort("-createdAt")
					.lean();
				return { sites: docs.map(toDbSite) };
			} catch (err) {
				void log.error("Error listing database sites", { type: "site", action: "list", error: { message: err instanceof Error ? err.message : String(err) } });
				return httpError.internal();
			}
		},
		480,
	);
}

export async function listKubernetesExtras(): Promise<{ extras?: Array<{ id: string } & SiteExtras>; error?: APIError }> {
	return withCache(
		"kubernetes-extras",
		async () => {
			try {
				await db.connect();
				const docs = await SiteModel.find({ infrastructure: INFRASTRUCTURES.KUBERNETES.NAME }).select("id ticket comment monitored responsibles").lean();
				return { extras: docs.map(toExtras) };
			} catch (err) {
				void log.error("Error listing Kubernetes extras", { type: "site", action: "list", error: { message: err instanceof Error ? err.message : String(err) } });
				return httpError.internal();
			}
		},
		480,
	);
}

export async function createDatabaseSite(form: SiteForm): Promise<{ siteId?: string; error?: APIError }> {
	try {
		const databaseInfras = Object.values(INFRASTRUCTURES)
			.filter((i) => i.PERSISTENCE === "database")
			.map((i) => i.NAME);

		if (!(databaseInfras as string[]).includes(form.infrastructure)) {
			return httpError.badRequest("Invalid infrastructure for database creation");
		}

		const dbForm = form as DatabaseSiteForm;
		await db.connect();

		const id = uuid();
		await new SiteModel({
			id,
			url: ensureSlashAtEnd(dbForm.url),
			infrastructure: dbForm.infrastructure,
			createdAt: new Date(),
			title: dbForm.title,
			tagline: dbForm.tagline,
			ticket: dbForm.ticket,
			comment: dbForm.comment,
			monitored: dbForm.monitored,
			responsibles: dbForm.responsibles,
		}).save();

		await cache.invalidateSitesCache();
		return { siteId: id };
	} catch (err) {
		void log.error("Error creating database site", { type: "site", action: "create", error: { message: err instanceof Error ? err.message : String(err) } });
		return httpError.internal();
	}
}

export async function createDatabaseSiteExtras(siteId: string, extras: SiteExtras): Promise<{ error?: APIError }> {
	try {
		await db.connect();

		const { site, error } = await getKubernetesSite(siteId);
		if (error) return { error };
		if (!site) return httpError.notFound("Site not found");

		const existing = await SiteModel.findOne({ id: siteId });
		if (existing) return httpError.conflict("Site extras already exist");

		await new SiteModel({
			id: siteId,
			url: ensureSlashAtEnd(site.url),
			infrastructure: site.infrastructure,
			createdAt: site.createdAt,
			ticket: extras.ticket,
			comment: extras.comment,
			monitored: extras.monitored,
			responsibles: extras.responsibles,
		}).save();

		return {};
	} catch (err) {
		void log.error("Error creating database site extras", { type: "site", action: "create", id: siteId, error: { message: err instanceof Error ? err.message : String(err) } });
		return httpError.internal();
	}
}

export async function upsertDatabaseSiteExtras(siteId: string, extras: SiteExtras): Promise<{ error?: APIError }> {
	try {
		await db.connect();

		const existing = await SiteModel.findOne({ id: siteId });
		if (!existing) {
			const { site } = await getKubernetesSite(siteId);
			if (!site) return httpError.notFound("Site not found");

			await SiteModel.create({
				id: siteId,
				url: ensureSlashAtEnd(site.url),
				infrastructure: site.infrastructure,
				createdAt: site.createdAt,
				...(extras.ticket !== undefined && { ticket: extras.ticket }),
				...(extras.comment !== undefined && { comment: extras.comment }),
				...(extras.monitored !== undefined && { monitored: extras.monitored }),
				...(extras.responsibles !== undefined && { responsibles: extras.responsibles }),
			});
			await cache.invalidateSitesCache();
			return {};
		}

		await SiteModel.findOneAndUpdate(
			{ id: siteId },
			{
				...(extras.ticket !== undefined && { ticket: extras.ticket }),
				...(extras.comment !== undefined && { comment: extras.comment }),
				...(extras.monitored !== undefined && { monitored: extras.monitored }),
				...(extras.responsibles !== undefined && { responsibles: extras.responsibles }),
			},
		);

		await cache.invalidateSitesCache();
		return {};
	} catch (err) {
		void log.error("Error upserting database site extras", { type: "site", action: "update", id: siteId, error: { message: err instanceof Error ? err.message : String(err) } });
		return httpError.internal();
	}
}

export async function deleteDatabaseSiteExtras(siteId: string): Promise<{ error?: APIError }> {
	try {
		await db.connect();
		await SiteModel.deleteOne({ id: siteId });
		await cache.invalidateSitesCache();
		return {};
	} catch (err) {
		void log.error("Error deleting database site extras", { type: "site", action: "delete", id: siteId, error: { message: err instanceof Error ? err.message : String(err) } });
		return httpError.internal();
	}
}

export async function updateDatabaseSite(siteId: string, form: SiteForm): Promise<{ error?: APIError }> {
	try {
		const databaseInfras = Object.values(INFRASTRUCTURES)
			.filter((i) => i.PERSISTENCE === "database")
			.map((i) => i.NAME);

		if (!(databaseInfras as string[]).includes(form.infrastructure)) {
			return httpError.badRequest("Invalid infrastructure for database update");
		}

		const dbForm = form as DatabaseSiteForm;
		await db.connect();

		const update: Record<string, unknown> = {
			url: ensureSlashAtEnd(dbForm.url),
			infrastructure: dbForm.infrastructure,
		};
		if (dbForm.title !== undefined) update.title = dbForm.title;
		if (dbForm.tagline !== undefined) update.tagline = dbForm.tagline;
		if (dbForm.ticket !== undefined) update.ticket = dbForm.ticket;
		if (dbForm.comment !== undefined) update.comment = dbForm.comment;
		if (dbForm.responsibles !== undefined) update.responsibles = dbForm.responsibles;

		const updated = await SiteModel.findOneAndUpdate({ id: siteId }, update, { new: true });
		if (!updated) return httpError.notFound("Site not found");

		await cache.invalidateSitesCache();
		return {};
	} catch (err) {
		void log.error("Error updating database site", { type: "site", action: "update", id: siteId, error: { message: err instanceof Error ? err.message : String(err) } });
		return httpError.internal();
	}
}

export async function deleteDatabaseSite(id: string): Promise<{ error?: APIError }> {
	try {
		await db.connect();
		await SiteModel.deleteOne({ id });
		await cache.invalidateSitesCache();
		return {};
	} catch (err) {
		void log.error("Error deleting database site", { type: "site", action: "delete", id, error: { message: err instanceof Error ? err.message : String(err) } });
		return httpError.internal();
	}
}
