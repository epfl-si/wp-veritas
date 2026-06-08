"use server";
import { httpError } from "@/lib/errors";
import log from "@/lib/log";
import db from "@/lib/mongo";
import { type ILog, LogModel } from "@/models/Log";
import type { APIError } from "@/types/error";
import type { LogType, SearchLogsParams } from "@/types/log";
import { getPersonsByIds } from "./api";
import { getAbility } from "./policy";

function toLogType(doc: ILog, users: Array<{ id: string; name: string; userId?: string }>): LogType {
	return {
		id: doc.id,
		message: doc.message,
		data: doc.data,
		level: doc.level,
		timestamp: doc.timestamp,
		user: (() => {
			const u = users.find((u) => u.id === doc.userId);
			return u ? { userId: doc.userId as string, name: u.name } : undefined;
		})(),
	};
}

async function resolveUsers(logs: ILog[]): Promise<Array<{ id: string; name: string; userId?: string }>> {
	const userIds = [...new Set(logs.map((l) => l.userId).filter((id): id is string => typeof id === "string"))];
	return getPersonsByIds(userIds).then((res) => (res.success ? res.data : []));
}

export async function searchLogs(params: SearchLogsParams): Promise<{ logs?: LogType[]; total?: number; error?: APIError }> {
	try {
		if (!(await getAbility()).can("list", "Log")) {
			await log.warn("Permission denied for logs search", { type: "log", action: "search" });
			return httpError.forbidden();
		}

		if (params.limit && params.limit > 250) {
			return { error: { status: 400, message: "Limit cannot exceed 250", success: false } };
		}

		await db.connect();

		const query: Record<string, unknown> = {};
		if (params.search) query.message = { $regex: params.search, $options: "i" };
		if (params.level) query.level = params.level;
		if (params.actions?.length) query["data.action"] = { $in: params.actions };
		if (params.siteId) query["data.id"] = params.siteId;

		const [total, docs] = await Promise.all([
			LogModel.countDocuments(query),
			LogModel.find<ILog>(query)
				.sort({ timestamp: -1 })
				.skip(params.skip ?? 0)
				.limit(params.limit ?? 100)
				.exec(),
		]);

		const users = await resolveUsers(docs);
		return { logs: docs.map((d) => toLogType(d, users)), total };
	} catch (err) {
		await log.error("Failed to search logs", {
			type: "log",
			action: "search",
			error: { message: err instanceof Error ? err.message : "Unknown", stack: err instanceof Error ? err.stack : undefined },
		});
		return httpError.internal();
	}
}

export async function searchLogsAction(params: SearchLogsParams): Promise<{ logs: LogType[]; total: number; success: boolean }> {
	const result = await searchLogs(params);
	if (result.error) return { logs: [], total: 0, success: false };
	return { logs: result.logs ?? [], total: result.total ?? 0, success: true };
}

export async function getSiteLogsAction(siteId: string): Promise<{ logs: LogType[]; success: boolean }> {
	const result = await searchLogs({ siteId, limit: 100 });
	if (result.error) return { logs: [], success: false };
	return { logs: result.logs ?? [], success: true };
}
