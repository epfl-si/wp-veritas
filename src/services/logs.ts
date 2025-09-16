import { APIError } from "@/types/error";
import { hasPermission } from "./policy";
import { PERMISSIONS } from "@/constants/permissions";
import db from "@/lib/mongo";
import { info, error, warn } from "@/lib/log";
import { LogType, SearchLogsParams } from "@/types/log";
import { ILog, LogModel } from "@/models/Log";
import { getNames } from "@/lib/api";

export async function listLogs(): Promise<{ logs?: LogType[]; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.LOGS.LIST))) {
			await warn("Permission denied for logs listing", {
				type: "log",
				action: "list",
				error: "Forbidden - insufficient permissions",
			});
			return { error: { status: 403, message: "Forbidden", success: false } };
		}

		await db.connect();

		const logs = await LogModel.find<ILog>();

		await info("Logs listed successfully", {
			type: "log",
			action: "list",
			count: logs.length,
		});

		const userIds = new Set(logs.map((log) => log.userId).filter((id): id is string => typeof id === "string"));
		const users = await getNames(Array.from(userIds));

		return {
			logs: logs.map((log) => ({
				id: log.id,
				message: log.message,
				data: {
					type: log.data.type,
					action: log.data.action,
					id: log.data.id,
					object: log.data.object,
					error: log.data.error,
				},
				level: log.level,
				timestamp: log.timestamp,
				user: users.find((user) => user.userId === log.userId),
			})),
		};
	} catch (errorData) {
		console.error("Error listing logs:", errorData);
		await error("Failed to list logs", {
			type: "log",
			action: "list",
			error: errorData instanceof Error ? errorData.stack : "Unknown error",
		});
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}


export async function searchLogs(params: SearchLogsParams): Promise<{ logs?: LogType[]; total?: number; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.LOGS.LIST))) {
			await warn("Permission denied for logs search", {
				type: "log",
				action: "search",
				error: "Forbidden - insufficient permissions",
			});
			return { error: { status: 403, message: "Forbidden", success: false } };
		}

		await db.connect();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const query: Record<string, any> = {};

		if (params.search) {
			query.message = { $regex: params.search, $options: "i" };
		}

		if (params.level) {
			query.level = params.level;
		}

		if (params.actions && params.actions.length > 0) {
			query["data.action"] = { $in: params.actions };
		}

		const total = await LogModel.countDocuments(query);
		const logsQuery = LogModel.find<ILog>(query).sort({ timestamp: -1 });

		if (params.limit && params.limit > 250) {
			return { error: { status: 400, message: "Limit cannot exceed 250", success: false } };
		}

		if (params.skip && params.skip > 0) {
			logsQuery.skip(params.skip);
		}

		if (params.limit && params.limit > 0) {
			logsQuery.limit(params.limit);
		}

		const logs = await logsQuery.exec();

		const userIds = new Set(logs.map((log) => log.userId).filter((id): id is string => typeof id === "string"));
		const users = await getNames(Array.from(userIds));

		return {
			logs: logs.map((log) => ({
				id: log.id,
				message: log.message,
				data: {
					type: log.data.type,
					action: log.data.action,
					id: log.data.id,
					object: log.data.object,
					error: log.data.error,
				},
				level: log.level,
				timestamp: log.timestamp,
				user: users.find((user) => user.userId === log.userId),
			})),
			total,
		};
	} catch (errorData) {
		console.error("Error searching logs:", errorData);
		await error("Failed to search logs", {
			type: "log",
			action: "search",
			error: errorData instanceof Error ? errorData.stack : "Unknown error",
		});
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}
