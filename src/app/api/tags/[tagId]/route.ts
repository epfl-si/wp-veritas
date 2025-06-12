import { PERMISSIONS } from '@/constants/permissions';
import { isValidUUID } from '@/lib/utils';
import { auth } from '@/services/auth';
import { hasPermission } from '@/services/policy';
import { deleteTag } from '@/services/tags';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
	params: Promise<{
		tagId: string;
	}>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
	try {
		const session = await auth();
		if (!session?.user) return NextResponse.json({ status: 401, message: 'Unauthorized' }, { status: 401 });
		if (!(await hasPermission(PERMISSIONS.TAGS.DELETE))) return NextResponse.json({ status: 403, message: 'Forbidden' }, { status: 403 });

		const { tagId } = await params;
		if (!tagId) return NextResponse.json({ status: 400, message: 'Tag ID is required' }, { status: 400 });
		if (!isValidUUID(tagId)) return NextResponse.json({ status: 400, message: 'Invalid tag ID format' }, { status: 400 });

		const tag = await deleteTag(tagId);
		if (!tag.success) return NextResponse.json({ status: tag.status, message: tag.message }, { status: tag.status });

		return NextResponse.json({ status: 200, message: 'Tag deleted successfully' }, { status: 200 });
	} catch (error) {
		console.error('Error retrieving tags:', error);
		return NextResponse.json({ status: 500, message: 'Internal Server Error' }, { status: 500 });
	}
}
