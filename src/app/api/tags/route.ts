import { PERMISSIONS } from '@/constants/permissions';
import { TagModel } from '@/models/Tag';
import { getUser } from '@/services/auth';
import { hasPermission } from '@/services/policy';
import { createTag } from '@/services/tags';
import { createTagSchema } from '@/types/tags';
import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';

export async function GET(): Promise<NextResponse> {
	try {
		const user = await getUser();
		if (!user) return NextResponse.json({ status: 401, message: 'Unauthorized' }, { status: 401 });
		if (!(await hasPermission(PERMISSIONS.TAGS.LIST))) return NextResponse.json({ status: 403, message: 'Forbidden' }, { status: 403 });

		const tags = await TagModel.find({}, { _id: 0, __v: 0 });
		if (!tags) return NextResponse.json({ status: 404, message: 'No tags found' }, { status: 404 });
		return NextResponse.json({ status: 200, message: 'Tags retrieved successfully', items: tags }, { status: 200 });
	} catch (error) {
		console.error('Error retrieving tags:', error);
		return NextResponse.json({ status: 500, message: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(request: Request): Promise<NextResponse> {
	try {
		const user = await getUser();
		if (!user) return NextResponse.json({ status: 401, message: 'Unauthorized' }, { status: 401 });
		if (!(await hasPermission(PERMISSIONS.TAGS.CREATE))) return NextResponse.json({ status: 403, message: 'Forbidden' }, { status: 403 });

		const body = await request.json();

		const tagSchema = await createTagSchema();
		const validate = await tagSchema.safeParseAsync(body);

		if (!validate.success) return NextResponse.json({ status: 400, message: 'Invalid body', errors: validate.error.flatten().fieldErrors }, { status: 400 });

		const id = uuid();
		const tag = {
			id,
			type: validate.data.type,
			nameFr: validate.data.nameFr,
			nameEn: validate.data.nameEn,
			urlFr: validate.data.urlFr,
			urlEn: validate.data.urlEn,
		};

		const create = await createTag(tag);
		if (create.error) return NextResponse.json({ status: create.error.status, message: create.error.message }, { status: create.error.status });

		return NextResponse.json({ status: 201, message: 'Tag created successfully', tagId: create.tagId }, { status: 201 });
	} catch (error) {
		console.error('Error creating tag:', error);
		return NextResponse.json({ status: 500, message: 'Internal Server Error' }, { status: 500 });
	}
}
