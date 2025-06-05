import { APIError } from '@/types/error';
import { hasPermission } from './policy';
import { PERMISSIONS } from '@/constants/permissions';
import { TagFormType } from '@/types/tags';

export async function createTag(tag: TagFormType): Promise<APIError> {
	if (!(await hasPermission(PERMISSIONS.SITE.CREATE))) return { status: 403, message: 'Forbidden' };

	return { status: 501, message: 'Not implemented' };
}

export async function updateTag(tag: TagFormType): Promise<APIError> {
	if (!(await hasPermission(PERMISSIONS.SITE.UPDATE))) return { status: 403, message: 'Forbidden' };

	return { status: 501, message: 'Not implemented' };
}

export async function deleteTag(tagId: string): Promise<APIError> {
	if (!(await hasPermission(PERMISSIONS.SITE.DELETE))) return { status: 403, message: 'Forbidden' };

	return { status: 501, message: 'Not implemented' };
}

export async function getTag(tagId: string): Promise<TagFormType | APIError> {
	if (!(await hasPermission(PERMISSIONS.SITE.READ))) return { status: 403, message: 'Forbidden' };

	return { status: 501, message: 'Not implemented' };
}

export async function listTags(): Promise<TagFormType[] | APIError> {
	if (!(await hasPermission(PERMISSIONS.SITE.LIST))) return { status: 403, message: 'Forbidden' };

	return { status: 501, message: 'Not implemented' };
}

export async function associateTagWithSite(tagId: string, siteId: string): Promise<APIError> {
	if (!(await hasPermission(PERMISSIONS.TAGS.ASSOCIATE))) return { status: 403, message: 'Forbidden' };
	return { status: 501, message: 'Not implemented' };
}

export async function dissociateTagFromSite(tagId: string, siteId: string): Promise<APIError> {
	if (!(await hasPermission(PERMISSIONS.TAGS.DISSOCIATE))) return { status: 403, message: 'Forbidden' };

	return { status: 501, message: 'Not implemented' };
}
