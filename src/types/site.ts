import { z } from "zod";
import { getCreatableInfrastructures, getInfrastructuresByPersistence, INFRASTRUCTURES } from "@/constants/infrastructures";
import { getZodErrorMessages, type useZodErrorMessages } from "@/hooks/zod";
import type { DatabaseInfrastructureName, InfrastructureName, KubernetesInfrastructureName } from "@/types/infrastructure";
import type { PolylangPlugin } from "./languages";

// WordPress plugin structure shared with lib/plugins and lib/kubernetes
export interface WordPressPlugins {
	polylang?: PolylangPlugin;
	[key: string]: unknown;
}

// Extras stored in MongoDB as side-data for Kubernetes sites
export const SITE_EXTRA_KEYS = ["ticket", "comment", "monitored", "responsibles"] as const;
export type SiteExtraKey = (typeof SITE_EXTRA_KEYS)[number];

export interface SiteExtras {
	ticket?: string;
	comment?: string;
	monitored?: boolean;
	responsibles?: string[];
}

// Additional info derived from K8s resources (ingress, database, PVC)
export interface KubernetesSiteExtraInfo {
	siteId: string;
	ingressName?: string;
	databaseName?: string;
	databaseRef?: string;
	wordpressSiteName?: string;
	pvName?: string;
	pvcName: string;
	namespace: string;
}

// --- Domain types returned by the service layer ---

interface BaseSite extends SiteExtras {
	id: string;
	url: string;
	createdAt: Date;
	tags: string[];
	managed: boolean;
}

export interface KubernetesSite extends BaseSite {
	infrastructure: KubernetesInfrastructureName | "Temporary";
	title: string;
	tagline: string;
	theme: string;
	unitId: number;
	unitName?: string;
	languages: string[];
	categories: string[];
	downloadsProtectionScript: boolean;
}

export interface DatabaseSite extends BaseSite {
	infrastructure: DatabaseInfrastructureName;
	title?: string;
	tagline?: string;
}

export type Site = KubernetesSite | DatabaseSite;

// --- Type guards ---
// Temporary sites run in K8s (managed by wp-kleenex) but have persistence "none".
// isKubernetesSite includes them since they share the same data shape.
const K8S_INFRA_NAMES = new Set<string>([...getInfrastructuresByPersistence("kubernetes").map((i) => i.NAME), INFRASTRUCTURES.TEMPORARY.NAME]);
const DB_INFRA_NAMES = new Set<string>(getInfrastructuresByPersistence("database").map((i) => i.NAME));

export const isKubernetesSite = (site: Site): site is KubernetesSite => K8S_INFRA_NAMES.has(site.infrastructure);
export const isDatabaseSite = (site: Site): site is DatabaseSite => DB_INFRA_NAMES.has(site.infrastructure);
export const isNoneSite = (site: Site): site is KubernetesSite => site.infrastructure === INFRASTRUCTURES.TEMPORARY.NAME;

// --- Persistence helpers ---

export const getSitePersistence = (infrastructure: InfrastructureName): "kubernetes" | "database" | "none" => {
	const infra = Object.values(INFRASTRUCTURES).find((i) => i.NAME === infrastructure);
	return infra?.PERSISTENCE ?? "none";
};

export const isCreatableInfrastructure = (infrastructure: string): boolean => getCreatableInfrastructures().some((i) => i.NAME === infrastructure);

// --- Search result type ---

export interface SearchSite {
	id: string;
	url: string;
	loginUrl: string;
	infrastructure: InfrastructureName;
	unit: { id: string; name: string } | null;
	lastModified: { date: string; user: string } | null;
	recentModifications: Array<{
		date: string;
		user: string;
		page: string;
		available: boolean;
	}>;
	permissions: {
		editors: { userId: string; name: string }[];
		accreditors: string[];
	};
	kubernetesExtraInfo?: KubernetesSiteExtraInfo;
	urlNotFound?: boolean;
	searchedUrl?: string;
}

// --- Form types (used by Zod validation and React Hook Form) ---

interface BaseSiteForm extends SiteExtras {
	url: string;
}

export interface KubernetesSiteForm extends BaseSiteForm {
	infrastructure: KubernetesInfrastructureName;
	title: string;
	tagline: string;
	theme: string;
	unitId: number;
	languages: string[];
	categories: string[];
	downloadsProtectionScript?: boolean;
	createFromBackup?: boolean;
	backupEnvironment?: string;
	backupSite?: string;
}

export interface DatabaseSiteForm extends BaseSiteForm {
	infrastructure: DatabaseInfrastructureName;
	title?: string;
	tagline?: string;
}

export type SiteForm = KubernetesSiteForm | DatabaseSiteForm;

// --- Site list filters ---

export interface SiteListFilters {
	url: string;
	infrastructure: string;
	theme: string;
	hasCategories: boolean | null;
	hasDownloadsProtection: boolean | null;
	dateRange: { from?: Date; to?: Date };
	languages: string[];
	categories: string[];
}

// --- Zod schemas ---

const buildSiteSchema = (errorMessages: ReturnType<typeof useZodErrorMessages>) => {
	const creatableInfras = getCreatableInfrastructures();

	const baseFields = {
		url: z.string({ required_error: errorMessages.required, invalid_type_error: errorMessages.invalid_type }).url({ message: errorMessages.invalid_url }),
		ticket: z.string().optional(),
		comment: z.string().optional(),
		monitored: z.boolean().optional().default(false),
		responsibles: z.array(z.string()).optional().default([]),
		createFromBackup: z.boolean().optional().default(false),
		backupEnvironment: z.string().optional(),
		backupSite: z.string().optional(),
	};

	const kubernetesFields = {
		title: z.string({ required_error: errorMessages.required, invalid_type_error: errorMessages.invalid_type }).min(3, { message: errorMessages.too_small(3) }),
		tagline: z.string({ required_error: errorMessages.required, invalid_type_error: errorMessages.invalid_type }).min(3, { message: errorMessages.too_small(3) }),
		theme: z.string({ required_error: errorMessages.required, invalid_type_error: errorMessages.invalid_type }).min(1, { message: errorMessages.too_small(1) }),
		languages: z.array(z.string()).min(1, { message: errorMessages.too_small(1) }),
		categories: z.array(z.string()).optional().default([]),
		unitId: z.number({ required_error: errorMessages.required, invalid_type_error: errorMessages.invalid_type }).positive({ message: errorMessages.too_small(1) }),
		downloadsProtectionScript: z.boolean().optional().default(false),
	};

	const databaseFields = {
		title: z
			.string({ invalid_type_error: errorMessages.invalid_type })
			.min(3, { message: errorMessages.too_small(3) })
			.optional(),
		tagline: z
			.string({ invalid_type_error: errorMessages.invalid_type })
			.min(3, { message: errorMessages.too_small(3) })
			.optional(),
	};

	const kubernetesSchemas = creatableInfras
		.filter((i) => i.PERSISTENCE === "kubernetes")
		.map((i) => z.object({ ...baseFields, ...kubernetesFields, infrastructure: z.literal(i.NAME as KubernetesInfrastructureName) }));

	const databaseSchemas = creatableInfras
		.filter((i) => i.PERSISTENCE === "database")
		.map((i) => z.object({ ...baseFields, ...databaseFields, infrastructure: z.literal(i.NAME as DatabaseInfrastructureName) }));

	const allSchemas = [...kubernetesSchemas, ...databaseSchemas];
	if (allSchemas.length === 0) throw new Error("No creatable infrastructures found");

	return z.discriminatedUnion(
		"infrastructure",
		allSchemas as unknown as [z.ZodDiscriminatedUnionOption<"infrastructure">, ...z.ZodDiscriminatedUnionOption<"infrastructure">[]],
	) as unknown as z.ZodType<SiteForm>;
};

export const siteSchema = (errorMessages: ReturnType<typeof useZodErrorMessages>) => buildSiteSchema(errorMessages);

export const createSiteSchema = async () => {
	const errorMessages = await getZodErrorMessages();
	return buildSiteSchema(errorMessages);
};
