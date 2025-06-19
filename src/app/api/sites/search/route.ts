import { searchSites } from '@/services/site';
import { PERMISSIONS } from '@/constants/permissions';
import { auth } from '@/services/auth';
import { hasPermission } from '@/services/policy';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
	try {
		const session = await auth();
		if (!session?.user) return NextResponse.json({ status: 401, message: 'Unauthorized' }, { status: 401 });
		if (!(await hasPermission(PERMISSIONS.SITES.SEARCH))) return NextResponse.json({ status: 403, message: 'Forbidden' }, { status: 403 });

		const { searchParams } = new URL(request.url);
		const url = searchParams.get('url');
		if (!url) return NextResponse.json({ status: 400, message: 'URL is required' }, { status: 400 });

		const { sites, error } = await searchSites(url);
		if (error) return NextResponse.json({ status: error.status, message: error.message }, { status: error.status });
		if (!sites || sites.length === 0) return NextResponse.json({ status: 404, message: 'No sites found' }, { status: 404 });

		if (sites.length === 0) return NextResponse.json({ status: 404, message: 'No sites found matching the URL' }, { status: 404 });
		return NextResponse.json({ status: 200, message: 'Sites retrieved successfully', items: sites }, { status: 200 });
	} catch (error) {
		console.error('Error retrieving sites:', error);
		return NextResponse.json({ status: 500, message: 'Internal Server Error' }, { status: 500 });
	}
}
