"use server";
import { makeRequest } from "@/lib/api";
import { cache } from "@/lib/redis";
import type { ServiceResponse } from "@/types/response";

const PERSONS_CACHE_KEY = "persons-list";
const PERSONS_CACHE_TTL = 10 * 24 * 60 * 60;

export async function getPersons(): Promise<ServiceResponse<{ userId: string; name: string }[]>> {
	try {
		const cached = await cache.get<{ userId: string; name: string }[]>(PERSONS_CACHE_KEY);
		if (cached) {
			void (async () => {
				try {
					const data = await makeRequest<{ persons: { id: string; firstname: string; lastname: string; email?: string }[] }>("/persons?isaccredited=1", {
						method: "GET",
					});
					const persons = data.persons.map((p) => ({
						userId: p.id,
						name: `${p.firstname} ${p.lastname}`,
					}));

					await cache.set(PERSONS_CACHE_KEY, persons, PERSONS_CACHE_TTL);
				} catch (err) {
					console.error("Background persons cache refresh failed:", err);
				}
			})();
			return { success: true, data: cached };
		}

		const data = await makeRequest<{ persons: { id: string; firstname: string; lastname: string; email?: string }[] }>("/persons?isaccredited=1", {
			method: "GET",
		});

		const persons = data.persons.map((p) => ({
			userId: p.id,
			name: `${p.firstname} ${p.lastname}`,
		}));

		await cache.set(PERSONS_CACHE_KEY, persons, PERSONS_CACHE_TTL);

		return { success: true, data: persons };
	} catch (error) {
		console.error("Error fetching persons:", error);
		return { success: false, error: "Failed to fetch persons", code: "API_ERROR" };
	}
}
