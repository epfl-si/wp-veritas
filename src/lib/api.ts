async function makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(url, {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Basic ${Buffer.from(`${process.env.EPFL_API_USERNAME}:${process.env.EPFL_API_PASSWORD}`).toString('base64')}`,
		},
		...options,
	});
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	return response.json();
}

export async function getNames(userIds: string[]): Promise<{ userId: string; name: string }[]> {
	if (!userIds?.length) return [];
	const data = await makeRequest<{ persons: { id: string; firstname: string; lastname: string }[] }>(`${process.env.EPFL_API_URL}/persons?ids=${userIds.join(',')}`, { method: 'GET' });
	return data.persons.map((p: { id: string; firstname: string; lastname: string }) => ({ userId: p.id, name: `${p.firstname} ${p.lastname}`.trim() }));
}

export async function getUnits(unitIds: string[]): Promise<{ unitId: string; name: string }[]> {
	if (!unitIds?.length) return [];
	const data = await makeRequest<{ units: { id: string; name: string }[] }>(`${process.env.EPFL_API_URL}/units?ids=${unitIds.join(',')}`, { method: 'GET' });
	return data.units.map((u: { id: string; name: string }) => ({ unitId: u.id, name: u.name }));
}

export async function getEditors(unitId: string): Promise<{ unitId: string; editors: { userId: string; name: string }[] }> {
	if (!unitId) throw new Error('Unit ID required');
	const data = await makeRequest<{ authorizations: { persid: number; attribution?: string }[] }>(`${process.env.EPFL_API_URL}/authorizations?type=right&authid=WordPress.Editor&resid=${unitId}`, { method: 'GET' });
	if (!data.authorizations?.length) return { unitId, editors: [] };

	const personIds = [...new Set(data.authorizations.map((a: { persid: number; attribution?: string }) => a.persid.toString()))];
	const names = await getNames(personIds);
	const nameMap = new Map(names.map((n) => [n.userId, n.name]));

	return {
		unitId,
		editors: data.authorizations.filter((a) => a.attribution !== 'inherited').map((a: { persid: number; attribution?: string }) => ({ userId: a.persid.toString(), name: nameMap.get(a.persid.toString()) || 'Unknown' })),
	};
}

export async function getEditorsForUnits(unitIds: string[]): Promise<Record<string, { userId: string; name: string }[]>> {
	if (!unitIds?.length) return {};
	const results = await Promise.allSettled(unitIds.map((id) => getEditors(id)));
	return Object.fromEntries(unitIds.map((id, i) => [id, results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<{ unitId: string; editors: { userId: string; name: string }[] }>).value.editors : []]));
}
