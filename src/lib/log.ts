import { v4 as uuid } from "uuid";
import { LOG_LEVELS } from "@/constants/logs";
import { LogModel } from "@/models/Log";
import { getUser } from "@/services/auth";
import type { LogData, LogLevel } from "@/types/log";
import db from "./mongo";

async function write(level: LogLevel, message: string, data: LogData): Promise<void> {
	let userId: string | undefined;

	if (level !== "system") {
		try {
			const user = await getUser();
			userId = user?.userId;
		} catch {
			// non-blocking: missing user ID is acceptable
		}
	}

	try {
		await db.connect();
		await LogModel.create({ id: uuid(), level, message, data, timestamp: new Date(), userId });
	} catch (err) {
		console.error("Failed to write log entry:", err);
	}
}

const log = {
	debug: (message: string, data: LogData) => write(LOG_LEVELS.DEBUG.NAME as LogLevel, message, data),
	info: (message: string, data: LogData) => write(LOG_LEVELS.INFO.NAME as LogLevel, message, data),
	warn: (message: string, data: LogData) => write(LOG_LEVELS.WARN.NAME as LogLevel, message, data),
	error: (message: string, data: LogData) => write(LOG_LEVELS.ERROR.NAME as LogLevel, message, data),
	system: (message: string, data: LogData) => write(LOG_LEVELS.SYSTEM.NAME as LogLevel, message, data),
};

export default log;
