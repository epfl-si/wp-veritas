import { LOG_LEVELS } from "@/constants/logs";
import { LogModel } from "@/models/Log";
import { getUser } from "@/services/auth";
import { LogType } from "@/types/log";
import { v4 as uuid } from "uuid";
import db from "./mongo";

async function log({ message, data, level }: { message: string; level: LogType["level"]; data?: LogType["data"] }): Promise<void> {
	let userId: string | undefined;

	if (level !== "system") {
		try {
			const user = await getUser();
			userId = user?.userId;
		} catch (error) {
			console.warn("Failed to get user for logging:", error);
		}
	}

	const logEntry = {
		id: uuid(),
		level,
		message,
		data,
		timestamp: new Date(),
		userId,
	};

	await db.connect();

	try {
		await LogModel.create(logEntry);
	} catch (error) {
		console.error("Failed to create log entry:", error);
		throw error;
	}
}

export async function debug(message: string, data: LogType["data"]): Promise<void> {
	await log({ message, data, level: LOG_LEVELS.DEBUG.NAME as LogType["level"] });
}

export async function info(message: string, data: LogType["data"]): Promise<void> {
	await log({ message, data, level: LOG_LEVELS.INFO.NAME as LogType["level"] });
}

export async function warn(message: string, data: LogType["data"]): Promise<void> {
	await log({ message, data, level: LOG_LEVELS.WARN.NAME as LogType["level"] });
}

export async function error(message: string, data: LogType["data"]): Promise<void> {
	await log({ message, data, level: LOG_LEVELS.ERROR.NAME as LogType["level"] });
}

export async function system(message: string, data: LogType["data"]): Promise<void> {
	await log({ message, data, level: LOG_LEVELS.SYSTEM.NAME as LogType["level"] });
}
