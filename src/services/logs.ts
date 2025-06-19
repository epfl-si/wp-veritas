import { APIError } from "@/types/error";
import { hasPermission } from "./policy";
import { PERMISSIONS } from "@/constants/permissions";
import db from "@/lib/mongo";
import { info, error, warn } from "@/lib/log";
import { LogType } from "@/types/log";
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
			error: errorData instanceof Error ? errorData.message : "Unknown error",
		});
		return { error: { status: 500, message: "Internal Server Error", success: false } };
	}
}
