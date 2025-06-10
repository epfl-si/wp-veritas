import { PERMISSIONS } from '@/constants/permissions';
import { TagModel } from '@/models/Tag';
import { getUser } from '@/services/auth';
import { hasPermission } from '@/services/policy';
import { NextResponse } from 'next/server';

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
