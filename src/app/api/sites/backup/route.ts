import { PERMISSIONS } from "@/constants/permissions";
import { auth } from "@/services/auth";
import { hasPermission } from "@/services/policy";
import { getBackupSites } from "@/services/backup";
import { NextRequest, NextResponse } from "next/server";
import { BackupEnvironment } from "@/types/backup";

export async function GET(request: NextRequest): Promise<NextResponse> {
	try {
		const session = await auth();
		if (!session?.user) return NextResponse.json({ status: 401, message: "Unauthorized" }, { status: 401 });
		if (!(await hasPermission(PERMISSIONS.SITES.LIST))) return NextResponse.json({ status: 403, message: "Forbidden" }, { status: 403 });

		const { searchParams } = new URL(request.url);
		const environment = searchParams.get("environment") || "test";

		if (!["test", "prod"].includes(environment)) {
			return NextResponse.json({ status: 400, message: "Invalid environment. Must be test or prod" }, { status: 400 });
		}

		const sites = await getBackupSites(environment as BackupEnvironment);
		if (!sites) return NextResponse.json({ status: 404, message: "No backup sites found" }, { status: 404 });

		return NextResponse.json({ status: 200, message: "Backup sites retrieved successfully", items: sites }, { status: 200 });
	} catch (error) {
		console.error("Error retrieving backup sites:", error);
		return NextResponse.json({ status: 500, message: "Internal Server Error" }, { status: 500 });
	}
}
