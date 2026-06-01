"use server";
import { v4 as uuidv4 } from "uuid";
import { httpError } from "@/lib/errors";
import log from "@/lib/log";
import db from "@/lib/mongo";
import { cache } from "@/lib/redis";
import { isValidUUID } from "@/lib/utils";
import { type ITag, TagModel } from "@/models/Tag";
import type { APIError } from "@/types/error";
import type { ServiceResponse } from "@/types/response";
import { createTagSchema, type TagFormType, type TagsType, type TagType } from "@/types/tag";
import { getAbility } from "./policy";
import { getSite, listSites } from "./site";

export async function createTag(tag: TagFormType): Promise<{ tagId?: string; error?: APIError }> {
	try {
		if (!(await getAbility()).can("create", "Tag")) {
			await log.warn("Permission denied for tag creation", {
				type: "tag",
				action: "create",
				object: tag,
				error: { message: "Forbidden" },
			});
			return httpError.forbidden();
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
		cache.invalidateSitesCache();

		await log.info(`The tag ${tag.nameEn} (${tag.type}) created successfully.`, {
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
		await log.error("Failed to create tag", {
			type: "tag",
			action: "create",
			object: tag,
			error: { message: errorData instanceof Error ? errorData.message : "Unknown error", stack: errorData instanceof Error ? errorData.stack : undefined },
		});
		return httpError.internal();
	}
}

export async function updateTag(tagId: string, tag: TagFormType): Promise<{ tagId?: string; error?: APIError }> {
	try {
		if (!(await getAbility()).can("update", "Tag")) {
			await log.warn("Permission denied for tag update", {
				type: "tag",
				action: "update",
				id: tagId,
				object: tag,
				error: { message: "Forbidden" },
			});
			return httpError.forbidden();
		}

		await db.connect();

		if (!isValidUUID(tagId)) {
			return httpError.badRequest("Invalid tag ID format");
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
			return httpError.notFound("Tag not found");
		}

		cache.invalidateTagsCache();
		cache.invalidateSitesCache();
		await log.info(`The tag ${tag.nameEn} (${tag.type}) updated successfully.`, {
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
		await log.error("Failed to update tag", {
			type: "tag",
			action: "update",
			id: tagId,
			object: tag,
			error: { message: errorData instanceof Error ? errorData.message : "Unknown error", stack: errorData instanceof Error ? errorData.stack : undefined },
		});
		return httpError.internal();
	}
}

export async function deleteTag(tagId: string): Promise<{ error?: APIError }> {
	try {
		if (!(await getAbility()).can("delete", "Tag")) {
			await log.warn("Permission denied for tag deletion", {
				type: "tag",
				action: "delete",
				id: tagId,
				error: { message: "Forbidden" },
			});
			return httpError.forbidden();
		}

		await db.connect();

		if (!isValidUUID(tagId)) {
			return httpError.badRequest("Invalid tag ID format");
		}

		const tag = await TagModel.findOne({ id: tagId });
		if (!tag) {
			return httpError.notFound("Tag not found");
		}

		if (tag.sites && tag.sites.length > 0) {
			await log.warn("Tag deletion attempted with associated sites", {
				type: "tag",
				action: "delete",
				id: tagId,
				error: { message: "Tag cannot be deleted while associated with sites" },
			});
			return httpError.badRequest("Tag cannot be deleted while associated with sites");
		}

		await TagModel.deleteOne({ id: tagId });
		cache.invalidateTagsCache();
		cache.invalidateSitesCache();

		await log.info(`The tag ${tag.nameEn} (${tag.type}) deleted successfully.`, {
			type: "tag",
			action: "delete",
			id: tagId,
		});

		return {};
	} catch (errorData) {
		console.error("Error deleting tag:", errorData);
		await log.error("Failed to delete tag", {
			type: "tag",
			action: "delete",
			id: tagId,
			error: { message: errorData instanceof Error ? errorData.message : "Unknown error", stack: errorData instanceof Error ? errorData.stack : undefined },
		});
		return httpError.internal();
	}
}

export async function getTag(tagId: string): Promise<{ tag?: TagType; error?: APIError }> {
	try {
		if (!(await getAbility()).can("read", "Tag")) {
			await log.warn("Permission denied for tag read", {
				type: "tag",
				action: "read",
				id: tagId,
				error: { message: "Forbidden" },
			});
			return httpError.forbidden();
		}

		await db.connect();

		if (!isValidUUID(tagId)) {
			return httpError.badRequest("Invalid tag ID format");
		}

		const tag = await TagModel.findOne({ id: tagId });

		if (!tag) {
			return httpError.notFound("Tag not found");
		}

		await log.info(`The tag ${tag.nameEn} (${tag.type}) retrieved successfully.`, {
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
		await log.error("Failed to get tag", {
			type: "tag",
			action: "read",
			id: tagId,
			error: { message: errorData instanceof Error ? errorData.message : "Unknown error", stack: errorData instanceof Error ? errorData.stack : undefined },
		});
		return httpError.internal();
	}
}

export async function listTags(): Promise<{
	tags?: TagsType[];
	error?: APIError;
}> {
	try {
		if (!(await getAbility()).can("list", "Tag")) {
			await log.warn("Permission denied for tags listing", {
				type: "tag",
				action: "list",
				error: { message: "Forbidden" },
			});
			return httpError.forbidden();
		}

		await db.connect();

		const tags = await TagModel.find<ITag>();

		await log.info("The tags listed successfully", {
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
		await log.error("Failed to list tags", {
			type: "tag",
			action: "list",
			error: { message: errorData instanceof Error ? errorData.message : "Unknown error", stack: errorData instanceof Error ? errorData.stack : undefined },
		});
		return httpError.internal();
	}
}

export async function getTagsBySite(siteId: string): Promise<{ tags?: TagType[]; error?: APIError }> {
	try {
		if (!(await getAbility()).can("read", "Tag")) {
			await log.warn("Permission denied for tags by site", {
				type: "tag",
				action: "read",
				siteId,
				error: { message: "Forbidden" },
			});
			return httpError.forbidden();
		}

		await db.connect();

		if (!isValidUUID(siteId)) {
			return httpError.badRequest("Invalid site ID format");
		}

		const tags = await TagModel.find({ sites: siteId });
		const { sites } = await listSites();
		if (!sites) {
			await log.warn("No sites found while retrieving tags by site", {
				type: "tag",
				action: "read",
				siteId,
				error: { message: "No sites available" },
			});
			return httpError.notFound("No sites found");
		}
		const site = sites.find((s) => s.id === siteId);

		await log.info(`Tags for site ${site?.url || "Unknown Site"} retrieved successfully.`, {
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
		await log.error("Failed to get tags by site", {
			type: "tag",
			action: "read",
			siteId,
			error: { message: errorData instanceof Error ? errorData.message : "Unknown error", stack: errorData instanceof Error ? errorData.stack : undefined },
		});
		return httpError.internal();
	}
}

export async function associateTagWithSite(tagId: string, siteId: string): Promise<{ error?: APIError }> {
	try {
		if (!(await getAbility()).can("associate", "Tag")) {
			await log.warn("Permission denied for tag-site association", {
				type: "tag",
				action: "associate",
				tagId,
				siteId,
				error: { message: "Forbidden" },
			});
			return httpError.forbidden();
		}

		await db.connect();

		if (!isValidUUID(tagId)) {
			return httpError.badRequest("Invalid tag ID format");
		}

		if (!isValidUUID(siteId)) {
			return httpError.badRequest("Invalid site ID format");
		}

		const tag = await TagModel.findOne({ id: tagId });
		if (!tag) {
			await log.warn("Tag not found for association", {
				type: "tag",
				action: "associate",
				tagId,
				siteId,
				error: { message: "Tag not found" },
			});
			return httpError.notFound("Tag not found");
		}

		if (tag.sites?.includes(siteId)) {
			await log.warn("Site already associated with tag", {
				type: "tag",
				action: "associate",
				tagId,
				siteId,
				error: { message: "Site already associated" },
			});
			return httpError.conflict("Site already associated with this tag");
		}

		await TagModel.findOneAndUpdate({ id: tagId }, { $addToSet: { sites: siteId } }, { new: true });
		cache.invalidateTagsCache();
		cache.invalidateSitesCache();

		const { site } = await getSite(siteId);

		await log.info(`The tag ${tag.nameEn} (${tag.type}) associated with site ${site?.url} successfully.`, {
			type: "tag",
			action: "associate",
			tagId,
			siteId,
			tagName: tag.nameEn,
			tagType: tag.type,
		});

		return {};
	} catch (errorData) {
		await log.error("Failed to associate tag with site", {
			type: "tag",
			action: "associate",
			tagId,
			siteId,
			error: { message: errorData instanceof Error ? errorData.message : "Unknown error", stack: errorData instanceof Error ? errorData.stack : undefined },
		});
		return httpError.internal();
	}
}

export async function disassociateTagFromSite(tagId: string, siteId: string): Promise<{ error?: APIError }> {
	try {
		if (!(await getAbility()).can("dissociate", "Tag")) {
			await log.warn("Permission denied for tag-site dissociation", {
				type: "tag",
				action: "disassociate",
				tagId,
				siteId,
				error: { message: "Forbidden" },
			});
			return httpError.forbidden();
		}

		await db.connect();

		if (!isValidUUID(tagId)) {
			return httpError.badRequest("Invalid tag ID format");
		}

		if (!isValidUUID(siteId)) {
			return httpError.badRequest("Invalid site ID format");
		}

		const tag = await TagModel.findOne({ id: tagId });
		if (!tag) {
			await log.warn("Tag not found for dissociation", {
				type: "tag",
				action: "disassociate",
				tagId,
				siteId,
				error: { message: "Tag not found" },
			});
			return httpError.notFound("Tag not found");
		}

		if (!tag.sites?.includes(siteId)) {
			await log.warn("Site not associated with tag", {
				type: "tag",
				action: "disassociate",
				tagId,
				siteId,
				error: { message: "Site not associated" },
			});
			return httpError.notFound("Site is not associated with this tag");
		}

		await TagModel.findOneAndUpdate({ id: tagId }, { $pull: { sites: siteId } }, { new: true });
		cache.invalidateTagsCache();
		cache.invalidateSitesCache();
		const { site } = await getSite(siteId);

		await log.info(`The tag ${tag.nameEn} (${tag.type}) disassociated from site ${site?.url} successfully.`, {
			type: "tag",
			action: "disassociate",
			tagId,
			siteId,
			tagName: tag.nameEn,
			tagType: tag.type,
		});

		return {};
	} catch (errorData) {
		await log.error("Failed to disassociate tag from site", {
			type: "tag",
			action: "disassociate",
			tagId,
			siteId,
			error: { message: errorData instanceof Error ? errorData.message : "Unknown error", stack: errorData instanceof Error ? errorData.stack : undefined },
		});
		return httpError.internal();
	}
}

export const createTagAction = async (tag: TagFormType): Promise<ServiceResponse<{ tagId: string }>> => {
	try {
		const schema = await createTagSchema();
		const validate = await schema.safeParseAsync(tag);
		if (!validate.success) return { success: false, error: "Invalid data", code: "VALIDATION_ERROR" };
		const { tagId, error } = await createTag(validate.data);
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
		if (!tagId) return { success: false, error: "Unknown error", code: "UNKNOWN" };
		return { success: true, data: { tagId } };
	} catch {
		return { success: false, error: "Unknown error", code: "UNKNOWN" };
	}
};

export const updateTagAction = async (tagId: string, tag: TagFormType): Promise<ServiceResponse<{ tagId: string }>> => {
	try {
		const schema = await createTagSchema();
		const validate = await schema.safeParseAsync(tag);
		if (!validate.success) return { success: false, error: "Invalid data", code: "VALIDATION_ERROR" };
		const { error } = await updateTag(tagId, validate.data);
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
		return { success: true, data: { tagId } };
	} catch {
		return { success: false, error: "Unknown error", code: "UNKNOWN" };
	}
};

export const deleteTagAction = async (tagId: string): Promise<void> => {
	const { error } = await deleteTag(tagId);
	if (error) throw new Error(error.message);
};
