import { APIError } from '@/types/error';
import { hasPermission } from './policy';
import { PERMISSIONS } from '@/constants/permissions';
import { TagFormType, TagType } from '@/types/tags';
import db from '@/lib/mongo';
import { ITag, TagModel } from '@/models/Tag';
import { v4 as uuidv4 } from 'uuid';
import { isValidUUID } from '@/lib/utils';
import { info, error } from '@/lib/log';

export async function createTag(tag: TagFormType): Promise<{ tagId?: string; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.CREATE))) return { error: { status: 403, message: 'Forbidden' } };

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

		await info(`New tag created`, {
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
		return { error: { status: 500, message: 'Internal Server Error' } };
	}
}

export async function updateTag(tagId: string, tag: TagFormType): Promise<{ tagId?: string; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.UPDATE))) return { error: { status: 403, message: 'Forbidden' } };

		await db.connect();

		if (!isValidUUID(tagId)) {
			return { error: { status: 400, message: 'Invalid tag ID format' } };
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
			return { error: { status: 404, message: 'Tag not found' } };
		}

		return {
			tagId,
		};
	} catch (error) {
		console.error('Error updating tag:', error);
		return { error: { status: 500, message: 'Internal Server Error' } };
	}
}

export async function deleteTag(tagId: string): Promise<{ success?: boolean; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.DELETE))) return { error: { status: 403, message: 'Forbidden' } };

		await db.connect();

		if (!isValidUUID(tagId)) {
			return { error: { status: 400, message: 'Invalid tag ID format' } };
		}

		const deletedTag = await TagModel.findOneAndDelete({ id: tagId });

		if (!deletedTag) {
			return { error: { status: 404, message: 'Tag not found' } };
		}

		return { success: true };
	} catch (error) {
		console.error('Error deleting tag:', error);
		return { error: { status: 500, message: 'Internal Server Error' } };
	}
}

export async function getTag(tagId: string): Promise<{ tag?: TagType; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.READ))) return { error: { status: 403, message: 'Forbidden' } };

		await db.connect();

		if (!isValidUUID(tagId)) {
			return { error: { status: 400, message: 'Invalid tag ID format' } };
		}

		const tag = await TagModel.findOne({ id: tagId });

		if (!tag) {
			return { error: { status: 404, message: 'Tag not found' } };
		}

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
	} catch (error) {
		console.error('Error getting tag:', error);
		return { error: { status: 500, message: 'Internal Server Error' } };
	}
}

export async function listTags(): Promise<{ tags?: TagType[]; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.LIST))) return { error: { status: 403, message: 'Forbidden' } };

		await db.connect();

		const tags = await TagModel.find<ITag>();

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
	} catch (error) {
		console.error('Error listing tags:', error);
		return { error: { status: 500, message: 'Internal Server Error' } };
	}
}

export async function associateTagWithSite(tagId: string, siteId: string): Promise<{ success?: boolean; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.ASSOCIATE))) return { error: { status: 403, message: 'Forbidden' } };

		await db.connect();

		return { success: true };
	} catch (error) {
		console.error('Error associating tag with site:', error);
		return { error: { status: 500, message: 'Internal Server Error' } };
	}
}

export async function dissociateTagFromSite(tagId: string, siteId: string): Promise<{ success?: boolean; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.TAGS.DISSOCIATE))) return { error: { status: 403, message: 'Forbidden' } };

		await db.connect();

		return { success: true };
	} catch (error) {
		console.error('Error dissociating tag from site:', error);
		return { error: { status: 500, message: 'Internal Server Error' } };
	}
}
