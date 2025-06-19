import { PERMISSIONS } from "@/constants/permissions";
import { isValidUUID } from "@/lib/utils";
import { auth } from "@/services/auth";
import { hasPermission } from "@/services/policy";
import { deleteSite, updateSite } from "@/services/site";
import { createSiteSchema } from "@/types/site";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
	params: Promise<{
		siteId: string;
	}>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
	try {
		const session = await auth();
		if (!session?.user) return NextResponse.json({ status: 401, message: "Unauthorized" }, { status: 401 });
		if (!(await hasPermission(PERMISSIONS.SITES.DELETE))) return NextResponse.json({ status: 403, message: "Forbidden" }, { status: 403 });

		const { siteId } = await params;
		if (!siteId) return NextResponse.json({ status: 400, message: "Site ID is required" }, { status: 400 });
		if (!isValidUUID(siteId)) return NextResponse.json({ status: 400, message: "Invalid site ID format" }, { status: 400 });

		const site = await deleteSite(siteId);
		if (site.error) return NextResponse.json({ status: site.error.status, message: site.error.message }, { status: site.error.status });
		return NextResponse.json({ status: 200, message: "Site deleted successfully" }, { status: 200 });
	} catch (error) {
		console.error("Error deleting site:", error);
		return NextResponse.json({ status: 500, message: "Internal Server Error" }, { status: 500 });
	}
}

export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
	try {
		const session = await auth();
		if (!session?.user) return NextResponse.json({ status: 401, message: "Unauthorized" }, { status: 401 });
		if (!(await hasPermission(PERMISSIONS.SITES.UPDATE))) return NextResponse.json({ status: 403, message: "Forbidden" }, { status: 403 });

		const body = await request.json();

		const siteSchema = await createSiteSchema();
		const validate = await siteSchema.safeParseAsync(body);

		if (!validate.success) return NextResponse.json({ status: 400, message: "Invalid body", errors: validate.error.flatten().fieldErrors }, { status: 400 });

		const { siteId } = await params;
		if (!siteId) return NextResponse.json({ status: 400, message: "Site ID is required" }, { status: 400 });
		if (!isValidUUID(siteId)) return NextResponse.json({ status: 400, message: "Invalid site ID format" }, { status: 400 });

		const update = await updateSite(siteId, validate.data);
		if (update.error) return NextResponse.json({ status: update.error.status, message: update.error.message }, { status: update.error.status });

		return NextResponse.json({ status: 201, message: "Site updated successfully", siteId: siteId }, { status: 201 });
	} catch (error) {
		console.error("Error creating site:", error);
		return NextResponse.json({ status: 500, message: "Internal Server Error" }, { status: 500 });
	}
}
