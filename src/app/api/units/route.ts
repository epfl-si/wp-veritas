import { NextResponse } from "next/server";
import { getUnits } from "@/lib/api";
import { auth } from "@/services/auth";
import { hasPermission } from "@/services/policy";
import { PERMISSIONS } from "@/constants/permissions";

export async function GET(): Promise<NextResponse> {
	try {
		const session = await auth();
		if (!session?.user) return NextResponse.json({ status: 401, message: "Unauthorized" }, { status: 401 });
		if (!(await hasPermission(PERMISSIONS.SITES.CREATE) || await hasPermission(PERMISSIONS.SITES.UPDATE))) {
			return NextResponse.json({ status: 403, message: "Forbidden" }, { status: 403 });
		}

		const units = await getUnits();
		return NextResponse.json({ status: 200, message: "Backup sites retrieved successfully", items: units }, { status: 200 });

	} catch (error) {
		console.error("Error deleting site:", error);
		return NextResponse.json({ status: 500, message: "Internal Server Error" }, { status: 500 });
	}
}
