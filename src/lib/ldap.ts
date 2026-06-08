import { Client } from "ldapts";

const LDAP_URL = "ldap://ldap.epfl.ch";
const LDAP_BASE = "o=epfl,c=ch";

async function withLdap<T>(fn: (client: Client) => Promise<T>): Promise<T> {
	const client = new Client({ url: LDAP_URL, timeout: 10000 });
	await client.bind("", "");
	try {
		return await fn(client);
	} finally {
		await client.unbind();
	}
}

export async function ldapSearchPersons(): Promise<{ id: string; firstname: string; lastname: string }[]> {
	return withLdap(async (client) => {
		const { searchEntries } = await client.search(LDAP_BASE, {
			scope: "sub",
			filter: "(&(objectClass=person)(givenName=*))",
			attributes: ["uniqueIdentifier", "givenName", "sn"],
			paged: { pageSize: 500 },
		});

		const seen = new Set<string>();
		const persons: { id: string; firstname: string; lastname: string }[] = [];

		for (const entry of searchEntries) {
			const id = Array.isArray(entry.uniqueIdentifier) ? entry.uniqueIdentifier[0] : entry.uniqueIdentifier;
			if (!id || seen.has(id as string)) continue;
			seen.add(id as string);
			persons.push({
				id: id as string,
				firstname: (Array.isArray(entry.givenName) ? entry.givenName[0] : entry.givenName) as string,
				lastname: (Array.isArray(entry.sn) ? entry.sn[0] : entry.sn) as string,
			});
		}

		return persons;
	});
}

export async function ldapGetPersonsByIds(scipers: string[]): Promise<{ id: string; firstname: string; lastname: string }[]> {
	if (!scipers.length) return [];
	return withLdap(async (client) => {
		const filter = scipers.length === 1 ? `(uniqueIdentifier=${scipers[0]})` : `(|${scipers.map((s) => `(uniqueIdentifier=${s})`).join("")})`;

		const { searchEntries } = await client.search(LDAP_BASE, {
			scope: "sub",
			filter: `(&(objectClass=person)(givenName=*)${filter})`,
			attributes: ["uniqueIdentifier", "givenName", "sn"],
		});

		const seen = new Set<string>();
		const persons: { id: string; firstname: string; lastname: string }[] = [];

		for (const entry of searchEntries) {
			const id = Array.isArray(entry.uniqueIdentifier) ? entry.uniqueIdentifier[0] : entry.uniqueIdentifier;
			if (!id || seen.has(id as string)) continue;
			seen.add(id as string);
			persons.push({
				id: id as string,
				firstname: (Array.isArray(entry.givenName) ? entry.givenName[0] : entry.givenName) as string,
				lastname: (Array.isArray(entry.sn) ? entry.sn[0] : entry.sn) as string,
			});
		}

		return persons;
	});
}

export async function ldapGetPersonsByUids(uids: string[]): Promise<{ id: string; name: string }[]> {
	if (!uids.length) return [];
	return withLdap(async (client) => {
		const filter = uids.length === 1 ? `(uid=${uids[0]})` : `(|${uids.map((u) => `(uid=${u})`).join("")})`;

		const { searchEntries } = await client.search(LDAP_BASE, {
			scope: "sub",
			filter: `(&(objectClass=person)(givenName=*)${filter})`,
			attributes: ["uid", "givenName", "sn"],
		});

		const seen = new Set<string>();
		const persons: { id: string; name: string }[] = [];

		for (const entry of searchEntries) {
			const rawUid = Array.isArray(entry.uid) ? entry.uid[0] : entry.uid;
			// uid can be "gaspar@unit", keep only the base login
			const uid = (rawUid as string)?.split("@")[0];
			if (!uid || seen.has(uid)) continue;
			seen.add(uid);
			const firstname = (Array.isArray(entry.givenName) ? entry.givenName[0] : entry.givenName) as string;
			const lastname = (Array.isArray(entry.sn) ? entry.sn[0] : entry.sn) as string;
			persons.push({ id: uid, name: `${firstname} ${lastname}`.trim() });
		}

		return persons;
	});
}
