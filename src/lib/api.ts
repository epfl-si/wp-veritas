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
	try {
		if (!userIds?.length) return [];
		const data = await makeRequest<{ persons: { id: string; firstname: string; lastname: string }[] }>(`${process.env.EPFL_API_URL}/persons?ids=${userIds.join(',')}`, { method: 'GET' });
		return data.persons.map((p: { id: string; firstname: string; lastname: string }) => ({ userId: p.id, name: `${p.firstname} ${p.lastname}`.trim() }));
	} catch (error) {
		console.error('Error fetching names:', error);
		return userIds.map((id) => ({ userId: id, name: 'Unknown' }));
	}
}

export async function getUnits(unitIds: string[]): Promise<{ unitId: string; name: string }[]> {
	try {
		if (!unitIds?.length) return [];
		const data = await makeRequest<{ units: { id: string; name: string }[] }>(`${process.env.EPFL_API_URL}/units?ids=${unitIds.join(',')}`, { method: 'GET' });
		return data.units.map((u: { id: string; name: string }) => ({ unitId: u.id, name: u.name }));
	} catch (error) {
		console.error('Error fetching units:', error);
		return unitIds.map((id) => ({ unitId: id, name: 'Unknown' }));
	}
}

export async function getUnit(unitId: string): Promise<{ id: string; name: string }> {
	try {
		const data = await makeRequest<{ id: string; name: string }>(`${process.env.EPFL_API_URL}/units/${unitId}`, { method: 'GET' });
		if (!data.id) throw new Error(`Unit not found: ${unitId}`);
		return { id: data.id, name: data.name };
	} catch (error) {
		console.error('Error fetching unit:', error);
		return { id: unitId, name: 'Unknown' };
	}
}

export async function getEditors(unitId: string): Promise<{ userId: string; name: string }[]> {
	try {
		if (!unitId) throw new Error('Unit ID required');
		const data = await makeRequest<{ authorizations: { persid: number; attribution?: string }[] }>(`${process.env.EPFL_API_URL}/authorizations?type=right&authid=WordPress.Editor&resid=${unitId}`, { method: 'GET' });
		if (!data.authorizations?.length) return [];

		const personIds = [...new Set(data.authorizations.map((a: { persid: number; attribution?: string }) => a.persid.toString()))];
		const names = await getNames(personIds);
		const nameMap = new Map(names.map((n) => [n.userId, n.name]));

		return data.authorizations.map((a: { persid: number; attribution?: string }) => ({ userId: a.persid.toString(), name: nameMap.get(a.persid.toString()) || 'Unknown' }));
	} catch (error) {
		console.error('Error fetching editors:', error);
		return [];
	}
}
