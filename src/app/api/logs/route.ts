import { NextRequest, NextResponse } from "next/server";
import { searchLogs } from "@/services/logs";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const search = searchParams.get("search") || "";
	const level = searchParams.get("level") || "";
	const actions = searchParams.get("actions") || "";
	const limit = parseInt(searchParams.get("limit") || "0");
	const skip = parseInt(searchParams.get("skip") || "0");

	const result = await searchLogs({
		search,
		level,
		actions: actions ? actions.split(",") : [],
		limit,
		skip,
	});

	if (result.error) {
		return NextResponse.json(result.error, { status: result.error.status });
	}

	return NextResponse.json({
		logs: result.logs,
		total: result.total,
		success: true,
	});
}