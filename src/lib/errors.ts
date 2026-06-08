import type { APIError } from "@/types/error";

type WithError = { error: APIError };

export const httpError = {
	forbidden: (): WithError => ({ error: { status: 403, message: "Forbidden", success: false } }),
	notFound: (msg = "Not found"): WithError => ({ error: { status: 404, message: msg, success: false } }),
	conflict: (msg = "Conflict"): WithError => ({ error: { status: 409, message: msg, success: false } }),
	badRequest: (msg = "Bad Request"): WithError => ({ error: { status: 400, message: msg, success: false } }),
	internal: (): WithError => ({ error: { status: 500, message: "Internal Server Error", success: false } }),
	notImplemented: (): WithError => ({ error: { status: 501, message: "Not Implemented", success: false } }),
};
