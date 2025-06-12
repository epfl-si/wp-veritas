import { PERMISSIONS } from '@/constants/permissions';
import { isValidUUID } from '@/lib/utils';
import { auth } from '@/services/auth';
import { hasPermission } from '@/services/policy';
import { deleteSite } from '@/services/site';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
	params: Promise<{
		siteId: string;
	}>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
	try {
		const session = await auth();
		if (!session?.user) return NextResponse.json({ status: 401, message: 'Unauthorized' }, { status: 401 });
		if (!(await hasPermission(PERMISSIONS.SITES.DELETE))) return NextResponse.json({ status: 403, message: 'Forbidden' }, { status: 403 });

		const { siteId } = await params;
		if (!siteId) return NextResponse.json({ status: 400, message: 'Site ID is required' }, { status: 400 });
		if (!isValidUUID(siteId)) return NextResponse.json({ status: 400, message: 'Invalid site ID format' }, { status: 400 });

		const site = await deleteSite(siteId);
		if (!site.success) return NextResponse.json({ status: site.status, message: site.message }, { status: site.status });
		return NextResponse.json({ status: 200, message: 'Site deleted successfully' }, { status: 200 });
	} catch (error) {
		console.error('Error deleting site:', error);
		return NextResponse.json({ status: 500, message: 'Internal Server Error' }, { status: 500 });
	}
}
