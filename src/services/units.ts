"use server";
import { getUnits } from "@/lib/api";
import type { ServiceResponse } from "@/types/response";

export const getUnitsAction = async (): Promise<ServiceResponse<{ unitId: string; name: string }[]>> => {
	try {
		const units = await getUnits();
		return { success: true, data: units };
	} catch {
		return { success: false, error: "Failed to load units", code: "DB_ERROR" };
	}
};
