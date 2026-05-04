import type { ErrorCode } from "@/types/error";

export type ServiceResponse<T> = { success: true; data: T } | { success: false; error: string; code: ErrorCode };
