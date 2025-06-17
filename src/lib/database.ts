import { SiteFormType, SiteType } from '@/types/site';
import { ensureSlashAtEnd } from './utils';
import { APIError } from '@/types/error';
import { SiteModel } from '@/models/Site';
import { v4 as uuid } from 'uuid';
import db from './mongo';
import { getKubernetesSite } from './kubernetes';

export async function getDatabaseSite(id: string): Promise<{ site?: SiteType; error?: APIError }> {
	try {
		await db.connect();

		const site = await SiteModel.findOne({ id });
		if (!site) {
			return { error: { status: 404, message: 'Site not found', success: false } };
		}
		return {
			site: {
				id: site.id,
				url: ensureSlashAtEnd(site.url),
				infrastructure: site.infrastructure,
				createdAt: site.createdAt,
				...(site.ticket && { ticket: site.ticket }),
				...(site.comment && { comment: site.comment }),
			},
		};
	} catch (error) {
		console.error('Error fetching site from database:', error);
		return {
			error: { status: 500, message: 'Internal Server Error', success: false },
		};
	}
}

export async function listDatabaseSites(): Promise<{ sites?: SiteType[]; error?: APIError }> {
	try {
		await db.connect();

		const sites = await SiteModel.find({});
		return {
			sites: sites.map((site) => ({
				id: site.id,
				url: ensureSlashAtEnd(site.url),
				infrastructure: site.infrastructure,
				createdAt: site.createdAt,
				...(site.ticket && { ticket: site.ticket }),
				...(site.comment && { comment: site.comment }),
			})),
		};
	} catch (error) {
		console.error('Error listing sites from database:', error);
		return {
			error: { status: 500, message: 'Internal Server Error', success: false },
		};
	}
}

export async function createDatabaseSite(site: SiteFormType): Promise<{ siteId?: string; error?: APIError }> {
	try {
		await db.connect();

		const id = uuid();
		const newSite = new SiteModel({
			id,
			url: ensureSlashAtEnd(site.url),
			infrastructure: site.infrastructure,
			createdAt: new Date(),
			...(site.ticket && { ticket: site.ticket }),
			...(site.comment && { comment: site.comment }),
		});

		await newSite.save();
		return { siteId: id };
	} catch (error) {
		console.error('Error creating site in database:', error);
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function createDatabaseSiteExtras(siteId: string, extras: { ticket?: string; comment?: string }): Promise<{ site?: SiteType; error?: APIError }> {
	try {
		await db.connect();

		const { site, error } = await getKubernetesSite(siteId);
		if (error) return { error: { status: error.status, message: error.message, success: false } };
		if (!site) return { error: { status: 404, message: 'Site not found', success: false } };

		const existingSite = await SiteModel.findOne({ id: siteId });
		if (existingSite) {
			return { error: { status: 409, message: 'Site extras already exist', success: false } };
		}

		const newSite = new SiteModel({
			id: siteId,
			url: ensureSlashAtEnd(site.url),
			...(extras.ticket && { ticket: extras.ticket }),
			...(extras.comment && { comment: extras.comment }),
		});

		await newSite.save();
		return { site: newSite };
	} catch (error) {
		console.error('Error creating site extras in database:', error);
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function updateDatabaseSiteExtras(siteId: string, extras: { ticket?: string; comment?: string }): Promise<{ site?: SiteType; error?: APIError }> {
	try {
		await db.connect();

		const updatedSite = await SiteModel.findOneAndUpdate(
			{ id: siteId },
			{
				...(extras.ticket !== undefined && { ticket: extras.ticket }),
				...(extras.comment !== undefined && { comment: extras.comment }),
			},
			{ new: true }
		);

		if (!updatedSite) {
			return { error: { status: 404, message: 'Site extras not found', success: false } };
		}

		return { site: updatedSite };
	} catch (error) {
		console.error('Error updating site extras in database:', error);
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function deleteDatabaseSiteExtras(siteId: string): Promise<{ success: boolean; error?: APIError }> {
	try {
		await db.connect();

		const result = await SiteModel.deleteOne({ id: siteId });
		if (result.deletedCount === 0) {
			return { success: false, error: { status: 404, message: 'Site extras not found', success: false } };
		}
		return { success: true };
	} catch (error) {
		console.error('Error deleting site extras from database:', error);
		return { success: false, error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function updateDatabaseSite(siteId: string, site: SiteFormType): Promise<{ site?: SiteType; error?: APIError }> {
	try {
		await db.connect();

		const updateData: Record<string, unknown> = {
			url: ensureSlashAtEnd(site.url),
			infrastructure: site.infrastructure,
		};

		if (site.ticket !== undefined) updateData.ticket = site.ticket;
		if (site.comment !== undefined) updateData.comment = site.comment;

		const updatedSite = await SiteModel.findOneAndUpdate({ id: siteId }, updateData, { new: true });

		if (!updatedSite) {
			return { error: { status: 404, message: 'Site not found', success: false } };
		}

		return { site: updatedSite };
	} catch (error) {
		console.error('Error updating site in database:', error);
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function deleteDatabaseSite(id: string): Promise<{ success: boolean; error?: APIError }> {
	try {
		await db.connect();

		await SiteModel.deleteOne({ id });
		return { success: true };
	} catch (error) {
		console.error('Error deleting site from database:', error);
		return { success: false, error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}
