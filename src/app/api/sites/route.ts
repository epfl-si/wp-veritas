import { PERMISSIONS } from "@/constants/permissions";
import { auth } from "@/services/auth";
import { hasPermission } from "@/services/policy";
import { createSite, listSites } from "@/services/site";
import { createSiteSchema } from "@/types/site";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
	try {
		const session = await auth();
		if (!session?.user) return NextResponse.json({ status: 401, message: "Unauthorized" }, { status: 401 });
		if (!(await hasPermission(PERMISSIONS.SITES.LIST))) return NextResponse.json({ status: 403, message: "Forbidden" }, { status: 403 });

		const { sites } = await listSites();
		if (!sites) return NextResponse.json({ status: 404, message: "No sites found" }, { status: 404 });
		return NextResponse.json({ status: 200, message: "Sites retrieved successfully", items: sites }, { status: 200 });
	} catch (error) {
		console.error("Error retrieving sites:", error);
		return NextResponse.json({ status: 500, message: "Internal Server Error" }, { status: 500 });
	}
}

export async function POST(request: Request): Promise<NextResponse> {
	try {
		const session = await auth();
		if (!session?.user) return NextResponse.json({ status: 401, message: "Unauthorized" }, { status: 401 });
		if (!(await hasPermission(PERMISSIONS.SITES.CREATE))) return NextResponse.json({ status: 403, message: "Forbidden" }, { status: 403 });

		const body = await request.json();

		const siteSchema = await createSiteSchema();
		const validate = await siteSchema.safeParseAsync(body);

		if (!validate.success) return NextResponse.json({ status: 400, message: "Invalid body", errors: validate.error.flatten().fieldErrors }, { status: 400 });

		const create = await createSite(validate.data);
		if (create.error) return NextResponse.json({ status: create.error.status, message: create.error.message }, { status: create.error.status });

		return NextResponse.json({ status: 201, message: "Site created successfully", siteId: create.siteId }, { status: 201 });
	} catch (error) {
		console.error("Error creating site:", error);
		return NextResponse.json({ status: 500, message: "Internal Server Error" }, { status: 500 });
	}
}
