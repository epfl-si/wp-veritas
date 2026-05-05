import { getPersonsByIds } from "@/services/api";

export async function makeRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
	const url = new URL(path, process.env.EPFL_API_URL).toString();
	const response = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			Authorization: `Basic ${Buffer.from(`${process.env.EPFL_API_USERNAME}:${process.env.EPFL_API_PASSWORD}`).toString("base64")}`,
		},
		...options,
	});
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	return response.json();
}

export async function getEditors(unitId: string): Promise<{ userId: string; name: string }[]> {
	try {
		if (!unitId) throw new Error("Unit ID required");
		const data = await makeRequest<{
			authorizations: { persid: number; attribution?: string }[];
		}>(`/v1/authorizations?type=right&authid=WordPress.Editor&resid=${unitId}`, { method: "GET" });
		if (!data.authorizations?.length) return [];

		const personIds = [...new Set(data.authorizations.map((a: { persid: number; attribution?: string }) => a.persid.toString()))];
		const names = await getPersonsByIds(personIds).then((res) => (res.success ? res.data : []));
		const nameMap = new Map(names.map((n) => [n.userId, n.name]));

		return data.authorizations
			.filter((authorization) => authorization.attribution !== "inherited")
			.map((a: { persid: number; attribution?: string }) => ({
				userId: a.persid.toString(),
				name: nameMap.get(a.persid.toString()) || "Unknown",
			}));
	} catch (error) {
		console.error("Error fetching editors:", error);
		return [];
	}
}
