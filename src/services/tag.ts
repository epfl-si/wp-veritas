import { APIError } from "@/types/error";
import { hasPermission } from "./policy";
import { PERMISSIONS } from "@/constants/permissions";
import { TagFormType, TagsType, TagType } from "@/types/tag";
import db from "@/lib/mongo";
import { ITag, TagModel } from "@/models/Tag";
import { v4 as uuidv4 } from "uuid";
import { isValidUUID } from "@/lib/utils";
import { info, warn, error } from "@/lib/log";
import { SiteModel } from "@/models/Site";
import { getSite, listSites } from "./site";
import { cache } from "@/lib/cache";

export async function createTag(tag: TagFormType): Promise<{ tagId?: string; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.CREATE))) {
			await warn("Permission denied for tag creation", {
				type: "tag",
				action: "create",
				object: tag,
				error: "Forbidden - insufficient permissions",
			});
			return { error: { status: 403, message: "Forbidden", success: false } };
		}

		await db.connect();

		const tagId = uuidv4();
		const newTag = new TagModel({
			id: tagId,
			type: tag.type,
			nameFr: tag.nameFr,
			nameEn: tag.nameEn,
			urlFr: tag.urlFr,
			urlEn: tag.urlEn,
		});

		const savedTag = await newTag.save();
		cache.invalidateTagsCache();

		await info(`The **${tag.type}** tag **${tag.nameEn}** created successfully`, {
			type: "tag",
			action: "create",
			id: tagId,
			object: tag,
		});

		return {
			tagId: savedTag.id,
		};
	} catch (errorData) {
		console.error("Error creating tag:", errorData);
		await error("Failed to create tag", {
			type: "tag",
			action: "create",
			object: tag,
			error: errorData instanceof Error ? errorData.stack : "Unknown error",
		});
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function updateTag(tagId: string, tag: TagFormType): Promise<{ tagId?: string; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.UPDATE))) {
			await warn("Permission denied for tag update", {
				type: "tag",
				action: "update",
				id: tagId,
				object: tag,
				error: "Forbidden - insufficient permissions",
			});
			return { error: { status: 403, message: "Forbidden", success: false } };
		}

		await db.connect();

		if (!isValidUUID(tagId)) {
			return { error: { status: 400, message: "Invalid tag ID format", success: false } };
		}

		const updatedTag = await TagModel.findOneAndUpdate(
			{ id: tagId },
			{
				type: tag.type,
				nameFr: tag.nameFr,
				nameEn: tag.nameEn,
				urlFr: tag.urlFr,
				urlEn: tag.urlEn,
			},
			{ new: true },
		);

		if (!updatedTag) {
			return { error: { status: 404, message: "Tag not found", success: false } };
		}

		cache.invalidateTagsCache();
		await info(`The **${tag.type}** tag **${tag.nameEn}** updated successfully`, {
			type: "tag",
			action: "update",
			id: tagId,
			object: tag,
		});

		return {
			tagId,
		};
	} catch (errorData) {
		console.error("Error updating tag:", errorData);
		await error("Failed to update tag", {
			type: "tag",
			action: "update",
			id: tagId,
			object: tag,
			error: errorData instanceof Error ? errorData.stack : "Unknown error",
		});
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function deleteTag(tagId: string): Promise<APIError> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.DELETE))) {
			await warn("Permission denied for tag deletion", {
				type: "tag",
				action: "delete",
				id: tagId,
				error: "Forbidden - insufficient permissions",
			});
			return { status: 403, message: "Forbidden", success: false };
		}

		await db.connect();

		if (!isValidUUID(tagId)) {
			return { status: 400, message: "Invalid tag ID format", success: false };
		}

		const tag = await TagModel.findOne({ id: tagId });
		if (!tag) {
			return { status: 404, message: "Tag not found", success: false };
		}

		if (tag.sites && tag.sites.length > 0) {
			await warn("Tag deletion attempted with associated sites", {
				type: "tag",
				action: "delete",
				id: tagId,
				error: "Tag cannot be deleted while associated with sites",
			});
			return { status: 400, message: "Tag cannot be deleted while associated with sites", success: false };
		}

		await TagModel.deleteOne({ id: tagId });
		cache.invalidateTagsCache();

		await info(`The **${tag.type}** tag **${tag.nameEn}** deleted successfully`, {
			type: "tag",
			action: "delete",
			id: tagId,
		});

		return { success: true, message: "Tag deleted successfully", status: 200 };
	} catch (errorData) {
		console.error("Error deleting tag:", errorData);
		await error("Failed to delete tag", {
			type: "tag",
			action: "delete",
			id: tagId,
			error: errorData instanceof Error ? errorData.stack : "Unknown error",
		});
		return { status: 500, message: "Internal Server Error", success: false };
	}
}

export async function getTag(tagId: string): Promise<{ tag?: TagType; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.READ))) {
			await warn("Permission denied for tag read", {
				type: "tag",
				action: "read",
				id: tagId,
				error: "Forbidden - insufficient permissions",
			});
			return { error: { status: 403, message: "Forbidden", success: false } };
		}

		await db.connect();

		if (!isValidUUID(tagId)) {
			return { error: { status: 400, message: "Invalid tag ID format", success: false } };
		}

		const tag = await TagModel.findOne({ id: tagId });

		if (!tag) {
			return { error: { status: 404, message: "Tag not found", success: false } };
		}

		await info(`The **${tag.type}** tag **${tag.nameEn}** retrieved successfully`, {
			type: "tag",
			action: "read",
			id: tagId,
		});

		const { sites } = await listSites();

		return {
			tag: {
				id: tag.id,
				type: tag.type,
				nameFr: tag.nameFr,
				nameEn: tag.nameEn,
				urlFr: tag.urlFr,
				urlEn: tag.urlEn,
				sites: (sites || [])
					.filter((site) => tag.sites?.includes(site.id))
					.map((site) => ({
						id: site.id,
						infrastructure: site.infrastructure,
						url: site.url,
					})),
			},
		};
	} catch (errorData) {
		console.error("Error getting tag:", errorData);
		await error("Failed to get tag", {
			type: "tag",
			action: "read",
			id: tagId,
			error: errorData instanceof Error ? errorData.stack : "Unknown error",
		});
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function listTags(): Promise<{ tags?: TagsType[]; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.LIST))) {
			await warn("Permission denied for tags listing", {
				type: "tag",
				action: "list",
				error: "Forbidden - insufficient permissions",
			});
			return { error: { status: 403, message: "Forbidden", success: false } };
		}

		await db.connect();

		const tags = await TagModel.find<ITag>();

		await info("The tags listed successfully", {
			type: "tag",
			action: "list",
			count: tags.length,
		});

		return {
			tags: tags.map((tag) => ({
				id: tag.id,
				type: tag.type,
				nameFr: tag.nameFr,
				nameEn: tag.nameEn,
				urlFr: tag.urlFr,
				urlEn: tag.urlEn,
				sites: tag.sites || [],
			})),
		};
	} catch (errorData) {
		console.error("Error listing tags:", errorData);
		await error("Failed to list tags", {
			type: "tag",
			action: "list",
			error: errorData instanceof Error ? errorData.stack : "Unknown error",
		});
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function getTagsBySite(siteId: string): Promise<{ tags?: TagType[]; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.READ))) {
			await warn("Permission denied for tags by site", {
				type: "tag",
				action: "read",
				siteId,
				error: "Forbidden - insufficient permissions",
			});
			return { error: { status: 403, message: "Forbidden", success: false } };
		}

		await db.connect();

		if (!isValidUUID(siteId)) {
			return { error: { status: 400, message: "Invalid site ID format", success: false } };
		}

		const tags = await TagModel.find({ sites: siteId });
		const site = await SiteModel.findOne({ id: siteId });

		await info(`Tags for site **${site?.url || "Unknown Site"}** retrieved successfully`, {
			type: "tag",
			action: "read",
			siteId,
			count: tags.length,
		});

		return {
			tags: tags.map((tag) => ({
				id: tag.id,
				type: tag.type,
				nameFr: tag.nameFr,
				nameEn: tag.nameEn,
				urlFr: tag.urlFr,
				urlEn: tag.urlEn,
			})),
		};
	} catch (errorData) {
		console.error("Error getting tags by site:", errorData);
		await error("Failed to get tags by site", {
			type: "tag",
			action: "read",
			siteId,
			error: errorData instanceof Error ? errorData.stack : "Unknown error",
		});
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}
export async function associateTagWithSite(tagId: string, siteId: string): Promise<{ error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.ASSOCIATE))) {
			await warn("Permission denied for tag-site association", {
				type: "tag",
				action: "associate",
				tagId,
				siteId,
				error: "Forbidden - insufficient permissions",
			});
			return { error: { status: 403, message: "Forbidden", success: false } };
		}

		await db.connect();

		if (!isValidUUID(tagId)) {
			return { error: { status: 400, message: "Invalid tag ID format", success: false } };
		}

		if (!isValidUUID(siteId)) {
			return { error: { status: 400, message: "Invalid site ID format", success: false } };
		}

		const tag = await TagModel.findOne({ id: tagId });
		if (!tag) {
			await warn("Tag not found for association", {
				type: "tag",
				action: "associate",
				tagId,
				siteId,
				error: "Tag not found",
			});
			return { error: { status: 404, message: "Tag not found", success: false } };
		}

		if (tag.sites && tag.sites.includes(siteId)) {
			await warn("Site already associated with tag", {
				type: "tag",
				action: "associate",
				tagId,
				siteId,
				error: "Site already associated",
			});
			return { error: { status: 409, message: "Site already associated with this tag", success: false } };
		}

		await TagModel.findOneAndUpdate({ id: tagId }, { $addToSet: { sites: siteId } }, { new: true });
		cache.invalidateTagsCache();

		const { site } = await getSite(siteId);

		await info(`The **${tag.type}** tag **${tag.nameEn}** associated with site **${site?.url}** successfully`, {
			type: "tag",
			action: "associate",
			tagId,
			siteId,
			tagName: tag.nameEn,
			tagType: tag.type,
		});

		return {};
	} catch (errorData) {
		await error("Failed to associate tag with site", {
			type: "tag",
			action: "associate",
			tagId,
			siteId,
			error: errorData instanceof Error ? errorData.stack : "Unknown error",
		});
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}

export async function disassociateTagFromSite(tagId: string, siteId: string): Promise<{ error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.DISSOCIATE))) {
			await warn("Permission denied for tag-site dissociation", {
				type: "tag",
				action: "disassociate",
				tagId,
				siteId,
				error: "Forbidden - insufficient permissions",
			});
			return { error: { status: 403, message: "Forbidden", success: false } };
		}

		await db.connect();

		if (!isValidUUID(tagId)) {
			return { error: { status: 400, message: "Invalid tag ID format", success: false } };
		}

		if (!isValidUUID(siteId)) {
			return { error: { status: 400, message: "Invalid site ID format", success: false } };
		}

		const tag = await TagModel.findOne({ id: tagId });
		if (!tag) {
			await warn("Tag not found for dissociation", {
				type: "tag",
				action: "disassociate",
				tagId,
				siteId,
				error: "Tag not found",
			});
			return { error: { status: 404, message: "Tag not found", success: false } };
		}

		if (!tag.sites || !tag.sites.includes(siteId)) {
			await warn("Site not associated with tag", {
				type: "tag",
				action: "disassociate",
				tagId,
				siteId,
				error: "Site not associated",
			});
			return { error: { status: 404, message: "Site is not associated with this tag", success: false } };
		}

		await TagModel.findOneAndUpdate({ id: tagId }, { $pull: { sites: siteId } }, { new: true });
		cache.invalidateTagsCache();
		const { site } = await getSite(siteId);

		await info(`The **${tag.type}** tag **${tag.nameEn}** disassociated from site **${site?.url}** successfully`, {
			type: "tag",
			action: "disassociate",
			tagId,
			siteId,
			tagName: tag.nameEn,
			tagType: tag.type,
		});

		return {};
	} catch (errorData) {
		await error("Failed to disassociate tag from site", {
			type: "tag",
			action: "disassociate",
			tagId,
			siteId,
			error: errorData instanceof Error ? errorData.stack : "Unknown error",
		});
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}
