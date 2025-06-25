import { SiteFormType, DatabaseSite, DatabaseSiteFormType } from "@/types/site";
import { ensureSlashAtEnd } from "./utils";
import { APIError } from "@/types/error";
import { SiteModel } from "@/models/Site";
import { v4 as uuid } from "uuid";
import db from "./mongo";
import { getKubernetesSite } from "./kubernetes";
import { INFRASTRUCTURES } from "@/constants/infrastructures";

export async function getDatabaseSite(id: string): Promise<{ site?: DatabaseSite; error?: APIError }> {
	try {
		await db.connect();

		const site = await SiteModel.findOne({ id });
		if (!site) {
			return { error: { status: 404, message: "Site not found", success: false } };
		}

		const databaseSite: DatabaseSite = {
			id: site.id,
			url: ensureSlashAtEnd(site.url),
			infrastructure: site.infrastructure as DatabaseSite["infrastructure"],
			createdAt: site.createdAt || new Date(),
			tags: [],
			ticket: site.ticket,
			comment: site.comment,
			managed: true,
		};

		return { site: databaseSite };
	} catch (error) {
		console.error("Error fetching site from database:", error);
		return {
			error: { status: 500, message: "Internal Server Error", success: false },
		};
	}
}

export async function listDatabaseSites(): Promise<{ sites?: DatabaseSite[]; error?: APIError }> {
	try {
		await db.connect();

		const sites = await SiteModel.find({});

		const databaseSites: DatabaseSite[] = sites
			.filter((site) =>
				Object.values(INFRASTRUCTURES)
					.filter((infra) => infra.PERSISTENCE)
					.map((infra) => infra.NAME)
					.includes(site.infrastructure || ""),
			)
			.map((site) => ({
				id: site.id,
				url: ensureSlashAtEnd(site.url),
				infrastructure: site.infrastructure as DatabaseSite["infrastructure"],
				createdAt: site.createdAt || new Date(),
				tags: [],
				ticket: site.ticket,
				comment: site.comment,
				managed: true,
			}));

		return { sites: databaseSites };
	} catch (error) {
		console.error("Error listing sites from database:", error);
		return {
			error: { status: 500, message: "Internal Server Error", success: false },
		};
	}
}

export async function createDatabaseSite(site: SiteFormType): Promise<{ siteId?: string; error?: APIError }> {
	try {
		if (
			!Object.values(INFRASTRUCTURES)
				.filter((infra) => infra.PERSISTENCE)
				.map((infra) => infra.NAME)
				.includes(site.infrastructure)
		) {
			return { error: { status: 400, message: "Invalid infrastructure for database creation", success: false } };
		}

		const databaseSite = site as DatabaseSiteFormType;

		await db.connect();

		const id = uuid();
		const newSite = new SiteModel({
			id,
			url: ensureSlashAtEnd(databaseSite.url),
			infrastructure: databaseSite.infrastructure,
			createdAt: new Date(),
			ticket: databaseSite.ticket,
			comment: databaseSite.comment,
		});

		await newSite.save();
		return { siteId: id };
	} catch (error) {
		console.error("Error creating site in database:", error);
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function createDatabaseSiteExtras(siteId: string, extras: { ticket?: string; comment?: string }): Promise<{ site?: DatabaseSite; error?: APIError }> {
	try {
		await db.connect();

		const { site, error } = await getKubernetesSite(siteId);
		if (error) return { error: { status: error.status, message: error.message, success: false } };
		if (!site) return { error: { status: 404, message: "Site not found", success: false } };

		const existingSite = await SiteModel.findOne({ id: siteId });
		if (existingSite) {
			return { error: { status: 409, message: "Site extras already exist", success: false } };
		}

		const newSite = new SiteModel({
			id: siteId,
			url: ensureSlashAtEnd(site.url),
			infrastructure: site.infrastructure,
			createdAt: site.createdAt,
			ticket: extras.ticket,
			comment: extras.comment,
		});

		await newSite.save();

		const result: DatabaseSite = {
			id: siteId,
			url: ensureSlashAtEnd(site.url),
			infrastructure: "External",
			createdAt: site.createdAt,
			tags: [],
			ticket: extras.ticket,
			comment: extras.comment,
			managed: true,
		};

		return { site: result };
	} catch (error) {
		console.error("Error creating site extras in database:", error);
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function updateDatabaseSiteExtras(siteId: string, extras: { ticket?: string; comment?: string }): Promise<{ site?: DatabaseSite; error?: APIError }> {
	try {
		await db.connect();

		const databaseSite = await SiteModel.findOne({ id: siteId });
		if (!databaseSite) {
			const { site } = await getKubernetesSite(siteId);
			if (!site) {
				return { error: { status: 404, message: "Site not found", success: false } };
			}
			await SiteModel.create({
				id: siteId,
				url: ensureSlashAtEnd(site.url),
				infrastructure: site.infrastructure,
				createdAt: site.createdAt,
				...(extras.ticket !== undefined && { ticket: extras.ticket }),
				...(extras.comment !== undefined && { comment: extras.comment }),
			});
		}

		const updatedSite = await SiteModel.findOneAndUpdate(
			{ id: siteId },
			{
				...(extras.ticket !== undefined && { ticket: extras.ticket }),
				...(extras.comment !== undefined && { comment: extras.comment }),
			},
			{ new: true },
		);

		if (!updatedSite) {
			return { error: { status: 404, message: "Site extras not found", success: false } };
		}

		const result: DatabaseSite = {
			id: updatedSite.id,
			url: ensureSlashAtEnd(updatedSite.url),
			infrastructure: "External",
			createdAt: updatedSite.createdAt || new Date(),
			tags: [],
			ticket: updatedSite.ticket,
			comment: updatedSite.comment,
			managed: true,
		};

		return { site: result };
	} catch (error) {
		console.error("Error updating site extras in database:", error);
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function deleteDatabaseSiteExtras(siteId: string): Promise<{ success: boolean; error?: APIError }> {
	try {
		await db.connect();

		const result = await SiteModel.deleteOne({ id: siteId });
		if (result.deletedCount === 0) {
			return { success: false, error: { status: 404, message: "Site extras not found", success: false } };
		}
		return { success: true };
	} catch (error) {
		console.error("Error deleting site extras from database:", error);
		return { success: false, error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function updateDatabaseSite(siteId: string, site: SiteFormType): Promise<{ site?: DatabaseSite; error?: APIError }> {
	try {
		if (
			!Object.values(INFRASTRUCTURES)
				.filter((infra) => infra.PERSISTENCE)
				.map((infra) => infra.NAME)
				.includes(site.infrastructure)
		) {
			return { error: { status: 400, message: "Invalid infrastructure for database update", success: false } };
		}

		const databaseSite = site as DatabaseSiteFormType;

		await db.connect();

		const updateData: Record<string, unknown> = {
			url: ensureSlashAtEnd(databaseSite.url),
			infrastructure: databaseSite.infrastructure,
		};

		if (databaseSite.ticket !== undefined) updateData.ticket = databaseSite.ticket;
		if (databaseSite.comment !== undefined) updateData.comment = databaseSite.comment;

		const updatedSite = await SiteModel.findOneAndUpdate({ id: siteId }, updateData, { new: true });

		if (!updatedSite) {
			return { error: { status: 404, message: "Site not found", success: false } };
		}

		const result: DatabaseSite = {
			id: updatedSite.id,
			url: ensureSlashAtEnd(updatedSite.url),
			infrastructure: updatedSite.infrastructure as DatabaseSite["infrastructure"],
			createdAt: updatedSite.createdAt || new Date(),
			tags: [],
			ticket: updatedSite.ticket,
			comment: updatedSite.comment,
			managed: true,
		};

		return { site: result };
	} catch (error) {
		console.error("Error updating site in database:", error);
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function deleteDatabaseSite(id: string): Promise<{ success: boolean; error?: APIError }> {
	try {
		await db.connect();

		await SiteModel.deleteOne({ id });
		return { success: true };
	} catch (error) {
		console.error("Error deleting site from database:", error);
		return { success: false, error: { status: 500, message: "Internal Server Error", success: false } };
	}
}
