import { getConfigMapValue } from "@/lib/kubernetes";
import { BackupConfig, BackupEnvironment } from "@/types/backup";
import { KubernetesSiteFormType, KubernetesSite } from "@/types/site";
import * as yaml from "js-yaml";

const BACKUP_CONFIG_MAP_NAME = "restore-config";

async function loadBackupConfig(): Promise<BackupConfig | null> {
	try {
		const configYaml = await getConfigMapValue(BACKUP_CONFIG_MAP_NAME, "config.yaml");
		return configYaml ? (yaml.load(configYaml) as BackupConfig) : null;
	} catch (error) {
		console.error("Error loading backup configuration:", error);
		return null;
	}
}

export async function getBackupSites(environment: BackupEnvironment): Promise<KubernetesSiteFormType[]> {
	try {
		const config = await loadBackupConfig();
		const apiUrl = config?.[environment]?.api?.url;
		if (!apiUrl) return [];

		const url = new URL(apiUrl);
		url.searchParams.set("infrastructure", "kubernetes");

		const response = await fetch(url, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
			signal: AbortSignal.timeout(10000),
		});

		if (!response.ok) return [];

		const data = await response.json();
		return Array.isArray(data)
			? data.map((site: KubernetesSite) => ({
				infrastructure: "Kubernetes",
				id: site.id,
				url: site.url,
				title: site.title || site.url,
				tagline: site.tagline || "",
				theme: site.theme,
				unitId: site.unitId,
				languages: site.languages || [],
				categories: site.categories || [],
				downloadsProtectionScript: site.downloadsProtectionScript || false,
				monitored: site.monitored || false,
			}))
			: [];
	} catch (error) {
		console.error(`Error fetching backup sites for ${environment}:`, error);
		return [];
	}
}

export async function getBackupConfig(environment: BackupEnvironment) {
	const config = await loadBackupConfig();
	const envConfig = config?.[environment];
	return envConfig;
}
