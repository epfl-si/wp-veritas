export type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "VALIDATION_ERROR" | "INTERNAL" | "MAIL_ERROR" | "UNKNOWN" | "API_ERROR";

export interface APIError {
	success: boolean;
	status: number;
	message: string;
}

export interface ErrorMessages {
	required: string;
	invalid_type: string;
	too_small: (min: number) => string;
	too_big: (max: number) => string;
	invalid_url: string;
	invalid_string: string;
	invalid_enum: (options: string[]) => string;
}
