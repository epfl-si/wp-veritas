import { APIError } from '@/types/error';
import { hasPermission } from './policy';
import { PERMISSIONS } from '@/constants/permissions';
import { TagFormType, TagType } from '@/types/tag';
import db from '@/lib/mongo';
import { ITag, TagModel } from '@/models/Tag';
import { v4 as uuidv4 } from 'uuid';
import { isValidUUID } from '@/lib/utils';
import { info, warn, error } from '@/lib/log';

export async function createTag(tag: TagFormType): Promise<{ tagId?: string; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.CREATE))) {
			await warn(`Permission denied for tag creation`, {
				type: 'tag',
				action: 'create',
				object: tag,
				error: 'Forbidden - insufficient permissions',
			});
			return { error: { status: 403, message: 'Forbidden', success: false } };
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

		await info(`New tag **${tag.nameEn}** created successfully`, {
			type: 'tag',
			action: 'create',
			id: tagId,
			object: tag,
		});

		return {
			tagId: savedTag.id,
		};
	} catch (errorData) {
		console.error('Error creating tag:', errorData);
		await error(`Failed to create tag`, {
			type: 'tag',
			action: 'create',
			object: tag,
			error: errorData instanceof Error ? errorData.message : 'Unknown error',
		});
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function updateTag(tagId: string, tag: TagFormType): Promise<{ tagId?: string; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.UPDATE))) {
			await warn(`Permission denied for tag update`, {
				type: 'tag',
				action: 'update',
				id: tagId,
				object: tag,
				error: 'Forbidden - insufficient permissions',
			});
			return { error: { status: 403, message: 'Forbidden', success: false } };
		}

		await db.connect();

		if (!isValidUUID(tagId)) {
			return { error: { status: 400, message: 'Invalid tag ID format', success: false } };
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
			{ new: true }
		);

		if (!updatedTag) {
			return { error: { status: 404, message: 'Tag not found', success: false } };
		}

		await info(`Tag **${tag.nameEn}** updated successfully`, {
			type: 'tag',
			action: 'update',
			id: tagId,
			object: tag,
		});

		return {
			tagId,
		};
	} catch (errorData) {
		console.error('Error updating tag:', errorData);
		await error(`Failed to update tag`, {
			type: 'tag',
			action: 'update',
			id: tagId,
			object: tag,
			error: errorData instanceof Error ? errorData.message : 'Unknown error',
		});
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function deleteTag(tagId: string): Promise<APIError> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.DELETE))) {
			await warn(`Permission denied for tag deletion`, {
				type: 'tag',
				action: 'delete',
				id: tagId,
				error: 'Forbidden - insufficient permissions',
			});
			return { status: 403, message: 'Forbidden', success: false };
		}

		await db.connect();

		if (!isValidUUID(tagId)) {
			return { status: 400, message: 'Invalid tag ID format', success: false };
		}

		const tag = await TagModel.findOne({ id: tagId });
		if (!tag) {
			return { status: 404, message: 'Tag not found', success: false };
		}

		await TagModel.deleteOne({ id: tagId });

		await info(`Tag **${tag.nameEn}** deleted successfully`, {
			type: 'tag',
			action: 'delete',
			id: tagId,
		});

		return { success: true, message: 'Tag deleted successfully', status: 200 };
	} catch (errorData) {
		console.error('Error deleting tag:', errorData);
		await error(`Failed to delete tag`, {
			type: 'tag',
			action: 'delete',
			id: tagId,
			error: errorData instanceof Error ? errorData.message : 'Unknown error',
		});
		return { status: 500, message: 'Internal Server Error', success: false };
	}
}

export async function getTag(tagId: string): Promise<{ tag?: TagType; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.READ))) {
			await warn(`Permission denied for tag read`, {
				type: 'tag',
				action: 'read',
				id: tagId,
				error: 'Forbidden - insufficient permissions',
			});
			return { error: { status: 403, message: 'Forbidden', success: false } };
		}

		await db.connect();

		if (!isValidUUID(tagId)) {
			return { error: { status: 400, message: 'Invalid tag ID format', success: false } };
		}

		const tag = await TagModel.findOne({ id: tagId });

		if (!tag) {
			return { error: { status: 404, message: 'Tag not found', success: false } };
		}

		await info(`Tag **${tag.nameEn}** retrieved successfully`, {
			type: 'tag',
			action: 'read',
			id: tagId,
		});

		return {
			tag: {
				id: tag.id,
				type: tag.type,
				nameFr: tag.nameFr,
				nameEn: tag.nameEn,
				urlFr: tag.urlFr,
				urlEn: tag.urlEn,
			},
		};
	} catch (errorData) {
		console.error('Error getting tag:', errorData);
		await error(`Failed to get tag`, {
			type: 'tag',
			action: 'read',
			id: tagId,
			error: errorData instanceof Error ? errorData.message : 'Unknown error',
		});
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function listTags(): Promise<{ tags?: TagType[]; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.LIST))) {
			await warn(`Permission denied for tags listing`, {
				type: 'tag',
				action: 'list',
				error: 'Forbidden - insufficient permissions',
			});
			return { error: { status: 403, message: 'Forbidden', success: false } };
		}

		await db.connect();

		const tags = await TagModel.find<ITag>();

		await info(`Tags listed successfully`, {
			type: 'tag',
			action: 'list',
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
		console.error('Error listing tags:', errorData);
		await error(`Failed to list tags`, {
			type: 'tag',
			action: 'list',
			error: errorData instanceof Error ? errorData.message : 'Unknown error',
		});
		return { error: { status: 500, message: 'Internal Server Error', success: false } };
	}
}

export async function associateTagWithSite(tagId: string, siteId: string): Promise<APIError> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.ASSOCIATE))) {
			await warn(`Permission denied for tag-site association`, {
				type: 'tag',
				action: 'associate',
				tagId,
				siteId,
				error: 'Forbidden - insufficient permissions',
			});
			return { status: 403, message: 'Forbidden', success: false };
		}

		await db.connect();

		// TODO: Implement the actual association logic here

		await info(`Tag associated with site successfully`, {
			type: 'tag',
			action: 'associate',
			tagId,
			siteId,
		});

		return { success: true, message: 'Tag associated with site successfully', status: 201 };
	} catch (errorData) {
		console.error('Error associating tag with site:', errorData);
		await error(`Failed to associate tag with site`, {
			type: 'tag',
			action: 'associate',
			tagId,
			siteId,
			error: errorData instanceof Error ? errorData.message : 'Unknown error',
		});
		return { status: 500, message: 'Internal Server Error', success: false };
	}
}

export async function dissociateTagFromSite(tagId: string, siteId: string): Promise<APIError> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.DISSOCIATE))) {
			await warn(`Permission denied for tag-site dissociation`, {
				type: 'tag',
				action: 'dissociate',
				tagId,
				siteId,
				error: 'Forbidden - insufficient permissions',
			});
			return { status: 403, message: 'Forbidden', success: false };
		}

		await db.connect();

		// TODO: Implement the actual dissociation logic here

		await info(`Tag dissociated from site successfully`, {
			type: 'tag',
			action: 'dissociate',
			tagId,
			siteId,
		});

		return { success: true, message: 'Tag dissociated from site successfully', status: 200 };
	} catch (errorData) {
		console.error('Error dissociating tag from site:', errorData);
		await error(`Failed to dissociate tag from site`, {
			type: 'tag',
			action: 'dissociate',
			tagId,
			siteId,
			error: errorData instanceof Error ? errorData.message : 'Unknown error',
		});
		return { status: 500, message: 'Internal Server Error', success: false };
	}
}
