import { EntraApplication } from "@/types/entra";
import { isKubernetesSite, SiteType } from "@/types/site";

export async function generateToken(): Promise<string> {
	const params = new URLSearchParams();
	params.append("client_id", process.env.ENTRA_APP_CLIENT_ID!);
	params.append("client_secret", process.env.ENTRA_APP_CLIENT_SECRET!);
	params.append("scope", "api://" + (process.env.ENTRA_APP_CLIENT_ID!) + "/.default");
	params.append("grant_type", "client_credentials");

	const response = await fetch(`https://login.microsoftonline.com/${process.env.ENTRA_APP_TENANT_ID}/oauth2/v2.0/token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params.toString(),
	});

	if (!response.ok) {
		const responseText = await response.text();
		throw new Error(`Failed to generate token: ${response.status} ${responseText}`);
	}

	const data = await response.json();
	return data.access_token;
}

export async function createApplication(site: SiteType): Promise<EntraApplication> {
	const token = await generateToken();

	if (!isKubernetesSite(site)) {
		throw new Error("Site type not supported for Entra application creation");
	}

	const body = {
		authorizedUsers: ["AAD_All Outside EPFL Users", "AAD_All Hosts Users", "AAD_All Student Users", "AAD_All Staff Users"],
		config_desc: `WordPress site ${site.tagline} (${site.url})`,
		description: `WordPress site ${site.tagline} (${site.url})`,
		displayName: "WP (" + site.tagline + ")",
		environmentID: process.env.NODE_ENV === "production" ? 3 : 2,
		notes: `Entra application for WordPress site ${site.tagline} (${site.url}) managed by WP-Veritas.`,
		spa: {
			redirectUris: [
				`${site.url}/wp-admin/admin-ajax.php?action=openid-connect-authorize`,
			],
		},
		unitID: "13030",
	};

	const response = await fetch(`${process.env.APP_PORTAL_URL}/app-portal-api/v1/portal/oidc-apps`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${token}`,
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		console.error("Create application response:", await response.text());
		throw new Error(`Failed to create application: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();
	return data;
}

export async function deleteApplication(appId: string): Promise<void> {
	const token = await generateToken();

	const response = await fetch(`${process.env.APP_PORTAL_URL}/app-portal-api/v1/portal/oidc-apps/${appId}`, {
		method: "DELETE",
		headers: {
			"Authorization": `Bearer ${token}`,
		},
	});

	if (!response.ok) {
		const responseText = await response.text();
		throw new Error(`Failed to delete application: ${response.status} ${responseText}`);
	}
}
