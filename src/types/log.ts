export type LogLevel = "debug" | "info" | "warn" | "error" | "system";

export type LogDomain = "site" | "tag" | "log" | "theme" | "user" | "auth" | "system";

export type LogAction = "create" | "update" | "delete" | "read" | "list" | "search" | "associate" | "disassociate";

export interface LogData {
	type: LogDomain | string;
	action: LogAction | string;
	id?: string;
	url?: string;
	count?: number;
	object?: unknown;
	changes?: Record<string, { from: unknown; to: unknown }>;
	error?: {
		message: string;
		stack?: string;
	};
	[key: string]: unknown;
}

export interface LogType {
	id: string;
	message: string;
	data: LogData;
	level: LogLevel;
	timestamp: Date;
	user?: {
		userId: string;
		name: string;
	};
}

export interface SearchLogsParams {
	search?: string;
	level?: string;
	actions?: string[];
	siteId?: string;
	limit?: number;
	skip?: number;
}
