export interface LogType {
	id: string;
	message: string;
	data: {
		type: string;
		action: string;
		id?: string;
		object?: object;
		error?: string;
		count?: number;
		[key: string]: string | number | boolean | object | undefined;
	};
	level: "debug" | "info" | "warn" | "error" | "system";
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
	limit?: number;
	skip?: number;
}
