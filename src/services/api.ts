"use server";
import { makeRequest } from "@/lib/api";
import { ldapSearchPersons } from "@/lib/ldap";
import { withCacheSWR } from "@/lib/redis";
import type { ServiceResponse } from "@/types/response";

const CACHE_TTL = 10 * 24 * 60 * 60;

export async function getPersons(): Promise<ServiceResponse<{ id: string; name: string }[]>> {
	try {
		const persons = await withCacheSWR(
			"persons-list",
			async () => {
				const data = await ldapSearchPersons();
				return data.map((p) => ({ id: p.id, name: `${p.firstname} ${p.lastname}` }));
			},
			CACHE_TTL,
		);
		return { success: true, data: persons };
	} catch (error) {
		console.error("Error fetching persons:", error);
		return { success: false, error: "Failed to fetch persons", code: "API_ERROR" };
	}
}

export async function getPersonsByIds(userIds: string[]): Promise<ServiceResponse<{ id: string; name: string }[]>> {
	try {
		if (!userIds?.length) return { success: true, data: [] };
		const data = await makeRequest<{
			persons: { id: string; firstname: string; lastname: string }[];
		}>(`/v1/persons?ids=${userIds.join(",")}`, { method: "GET" });
		return { success: true, data: data.persons.map((p) => ({ id: p.id, name: `${p.firstname} ${p.lastname}` })) };
	} catch (error) {
		console.error("Error fetching persons by IDs:", error);
		return { success: false, error: "Failed to fetch persons", code: "API_ERROR" };
	}
}

export async function getPersonsByUsernames(usernames: string[]): Promise<ServiceResponse<{ id: string; name: string }[]>> {
	try {
		if (!usernames?.length) return { success: true, data: [] };
		const results = await Promise.all(
			usernames.map(async (username) => {
				if (username === "admin") return { id: username, name: "Admin" };
				try {
					const data = await makeRequest<{ firstname: string; lastname: string }>(`/v1/persons/${username}`, { method: "GET" });
					return { id: username, name: `${data.firstname} ${data.lastname}`.trim() };
				} catch {
					return { id: username, name: "Unknown" };
				}
			}),
		);
		return { success: true, data: Array.from(new Set(results)) };
	} catch (error) {
		console.error("Error fetching persons by usernames:", error);
		return { success: false, error: "Failed to fetch persons", code: "API_ERROR" };
	}
}

export async function getUnits(): Promise<ServiceResponse<{ id: string; name: string }[]>> {
	try {
		const units = await withCacheSWR(
			"units-list",
			async () => {
				const data = await makeRequest<{ units: { id: string; name: string }[] }>("/v1/units", { method: "GET" });
				return data.units.map((u) => ({ id: u.id, name: u.name }));
			},
			CACHE_TTL,
		);
		return { success: true, data: units };
	} catch (error) {
		console.error("Error fetching units:", error);
		return { success: false, error: "Failed to fetch units", code: "API_ERROR" };
	}
}

export async function getUnitById(unitId: string): Promise<ServiceResponse<{ id: string; name: string } | null>> {
	try {
		const data = await makeRequest<{ id: string; name: string }>(`/v1/units/${unitId}`, { method: "GET" });
		return { success: true, data: { id: data.id, name: data.name } };
	} catch (error) {
		console.error("Error fetching unit by ID:", error);
		return { success: false, error: "Failed to fetch unit", code: "API_ERROR" };
	}
}
