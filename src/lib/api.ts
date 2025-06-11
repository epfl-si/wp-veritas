async function makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(url, {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Basic ${Buffer.from(`${process.env.EPFL_API_USERNAME}:${process.env.EPFL_API_PASSWORD}`).toString('base64')}`,
		},
		...options,
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	return response.json();
}

export async function getNamesFromUserIds(userIds: string[]): Promise<{ userId: string; name: string }[]> {
	if (!userIds?.length) return [];

	const url = `${process.env.EPFL_API_URL}/persons?ids=${userIds.join(',')}`;

	try {
		const data = await makeRequest<{ persons: { id: string; firstname: string; lastname: string }[] }>(url, {
			method: 'GET',
		});

		return data.persons.map((person) => ({
			userId: person.id,
			name: `${person.firstname} ${person.lastname}`,
		}));
	} catch (error) {
		console.error('Error fetching user names:', error);
		throw new Error('Failed to fetch user names');
	}
}
