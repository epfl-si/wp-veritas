import { NextRequest, NextResponse } from "next/server";
import { PERMISSIONS } from "@/constants/permissions";
import { isValidUUID } from "@/lib/utils";
import { auth } from "@/services/auth";
import { hasPermission } from "@/services/policy";
import { associateTagWithSite, disassociateTagFromSite } from "@/services/tag";

interface RouteParams {
	params: Promise<{
		tagId: string;
		siteId: string;
	}>;
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return NextResponse.json({ status: 401, message: "Unauthorized" }, { status: 401 });
		}

		if (!(await hasPermission(PERMISSIONS.TAGS.ASSOCIATE))) {
			return NextResponse.json({ status: 403, message: "Forbidden" }, { status: 403 });
		}

		const { tagId, siteId } = await params;

		if (!tagId) {
			return NextResponse.json({ status: 400, message: "Tag ID is required" }, { status: 400 });
		}

		if (!siteId) {
			return NextResponse.json({ status: 400, message: "Site ID is required" }, { status: 400 });
		}

		if (!isValidUUID(tagId)) {
			return NextResponse.json({ status: 400, message: "Invalid tag ID format" }, { status: 400 });
		}

		if (!isValidUUID(siteId)) {
			return NextResponse.json({ status: 400, message: "Invalid site ID format" }, { status: 400 });
		}

		const { error } = await associateTagWithSite(tagId, siteId);

		if (error) {
			return NextResponse.json({ status: error.status, message: error.message }, { status: error.status });
		}

		return NextResponse.json({ status: 201, message: "Tag associated with site successfully" }, { status: 201 });
	} catch (error) {
		console.error("Error in tag-site association API:", error);
		return NextResponse.json({ status: 500, message: "Internal Server Error" }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return NextResponse.json({ status: 401, message: "Unauthorized" }, { status: 401 });
		}

		if (!(await hasPermission(PERMISSIONS.TAGS.DISSOCIATE))) {
			return NextResponse.json({ status: 403, message: "Forbidden" }, { status: 403 });
		}

		const { tagId, siteId } = await params;

		if (!tagId) {
			return NextResponse.json({ status: 400, message: "Tag ID is required" }, { status: 400 });
		}

		if (!siteId) {
			return NextResponse.json({ status: 400, message: "Site ID is required" }, { status: 400 });
		}

		if (!isValidUUID(tagId)) {
			return NextResponse.json({ status: 400, message: "Invalid tag ID format" }, { status: 400 });
		}

		if (!isValidUUID(siteId)) {
			return NextResponse.json({ status: 400, message: "Invalid site ID format" }, { status: 400 });
		}

		const { error } = await disassociateTagFromSite(tagId, siteId);

		if (error) {
			return NextResponse.json({ status: error.status, message: error.message }, { status: error.status });
		}

		return NextResponse.json({ status: 200, message: "Tag dissociated from site successfully" }, { status: 200 });
	} catch (error) {
		console.error("Error in tag-site dissociation API:", error);
		return NextResponse.json({ status: 500, message: "Internal Server Error" }, { status: 500 });
	}
}
