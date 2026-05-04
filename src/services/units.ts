"use server";
import { makeRequest } from "@/lib/api";
import type { ServiceResponse } from "@/types/response";

export async function getUnits(): Promise<ServiceResponse<{ unitId: string; name: string }[]>> {
	try {
		const data = await makeRequest<{ units: { id: string; name: string }[] }>("/units", {
			method: "GET",
		});
		return {
			success: true,
			data: data.units.map((u) => ({
				unitId: u.id,
				name: u.name,
			})),
		};
	} catch (error) {
		console.error("Error fetching units:", error);
		return { success: false, error: "Failed to fetch units", code: "API_ERROR" };
	}
}
