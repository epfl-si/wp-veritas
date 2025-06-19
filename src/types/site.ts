import { z } from 'zod';
import { getZodErrorMessages, useZodErrorMessages } from '@/hooks/zod';
import type { KubernetesInfrastructureName, DatabaseInfrastructureName, NoneInfrastructureName, InfrastructureName } from '@/types/infrastructure';
import { INFRASTRUCTURES, getCreatableInfrastructures } from '@/constants/infrastructures';

export interface KubernetesSiteType {
	metadata: {
		uid: string;
		name: string;
		namespace: string;
		labels?: Record<string, string>;
		creationTimestamp: string;
	};
	spec: {
		owner: {
			epfl: {
				unitId: number;
			};
		};
		hostname: string;
		path: string;
		wordpress: {
			debug: boolean;
			downloadsProtectionScript?: string;
			languages: string[];
			plugins: Record<string, object>;
			tagline: string;
			theme: string;
			title: string;
		};
	};
	status?: {
		wordpresssite?: {
			lastCronJobRuntime?: string;
			plugins?: Record<string, object>;
			tagline?: string;
			title?: string;
		};
	};
}

interface BaseSiteType {
	id: string;
	url: string;
	createdAt: Date;
	tags: string[];
	ticket?: string;
	comment?: string;
}

export interface KubernetesSite extends BaseSiteType {
	infrastructure: KubernetesInfrastructureName;
	tagline: string;
	title: string;
	theme: string;
	unitId: number;
	languages: string[];
	categories: string[];
	downloadsProtectionScript: boolean;
}

export interface DatabaseSite extends BaseSiteType {
	infrastructure: DatabaseInfrastructureName;
}

export interface NoneSite extends BaseSiteType {
	infrastructure: NoneInfrastructureName;
}

export type SiteType = KubernetesSite | DatabaseSite | NoneSite;

export interface SearchSiteType {
	id: string;
	url: string;
	loginUrl: string;
	unit: {
		id: string;
		name: string;
	};
	lastModified: {
		date: string;
		user: string;
	} | null;
	recentModifications: Array<{
		date: string;
		user: string;
		page: string;
		available: boolean;
	}>;
	permissions: {
		editors: {
			userId: string;
			name: string;
		}[];
		accreditors: string[];
	};
}

interface BaseSiteFormType {
	url: string;
	ticket?: string;
	comment?: string;
}

export interface KubernetesSiteFormType extends BaseSiteFormType {
	infrastructure: KubernetesInfrastructureName;
	tagline: string;
	title: string;
	theme: string;
	unitId: number;
	languages: string[];
	categories: string[];
	downloadsProtectionScript?: boolean;
}

export interface DatabaseSiteFormType extends BaseSiteFormType {
	infrastructure: DatabaseInfrastructureName;
}

export interface NoneSiteFormType extends BaseSiteFormType {
	infrastructure: NoneInfrastructureName;
}

export type SiteFormType = KubernetesSiteFormType | DatabaseSiteFormType | NoneSiteFormType;

const createSiteSchemaBase = (errorMessages: ReturnType<typeof useZodErrorMessages>) => {
	const creatableInfras = getCreatableInfrastructures();

	const baseFields = {
		url: z
			.string({
				required_error: errorMessages.required,
				invalid_type_error: errorMessages.invalid_type,
			})
			.url({ message: errorMessages.invalid_url }),
		ticket: z.string().optional(),
		comment: z.string().optional(),
	};

	const kubernetesFields = {
		tagline: z
			.string({
				required_error: errorMessages.required,
				invalid_type_error: errorMessages.invalid_type,
			})
			.min(3, { message: errorMessages.too_small(3) }),
		title: z
			.string({
				required_error: errorMessages.required,
				invalid_type_error: errorMessages.invalid_type,
			})
			.min(3, { message: errorMessages.too_small(3) }),
		theme: z
			.string({
				required_error: errorMessages.required,
				invalid_type_error: errorMessages.invalid_type,
			})
			.min(1, { message: errorMessages.too_small(1) }),
		languages: z.array(z.string()).min(1, { message: errorMessages.too_small(1) }),
		categories: z.array(z.string()).optional().default([]),
		unitId: z
			.number({
				required_error: errorMessages.required,
				invalid_type_error: errorMessages.invalid_type,
			})
			.positive({ message: errorMessages.too_small(1) }),
		downloadsProtectionScript: z.boolean().optional().default(false),
	};

	const kubernetesSchemas = creatableInfras
		.filter((infra) => infra.PERSISTENCE === 'kubernetes')
		.map((infra) =>
			z.object({
				...baseFields,
				...kubernetesFields,
				infrastructure: z.literal(infra.NAME as KubernetesInfrastructureName),
			})
		);

	const databaseSchemas = creatableInfras
		.filter((infra) => infra.PERSISTENCE === 'database')
		.map((infra) =>
			z.object({
				...baseFields,
				infrastructure: z.literal(infra.NAME as DatabaseInfrastructureName),
			})
		);

	const noneSchemas = creatableInfras
		.filter((infra) => infra.PERSISTENCE === 'none')
		.map((infra) =>
			z.object({
				...baseFields,
				infrastructure: z.literal(infra.NAME as NoneInfrastructureName),
			})
		);

	const allSchemas = [...kubernetesSchemas, ...databaseSchemas, ...noneSchemas];

	if (allSchemas.length === 0) {
		throw new Error('No creatable infrastructures found');
	}

	return z.discriminatedUnion('infrastructure', allSchemas as unknown as [z.ZodDiscriminatedUnionOption<'infrastructure'>, ...z.ZodDiscriminatedUnionOption<'infrastructure'>[]]) as unknown as z.ZodType<SiteFormType>;
};

export const siteSchema = (errorMessages: ReturnType<typeof useZodErrorMessages>) => {
	return createSiteSchemaBase(errorMessages);
};

export const createSiteSchema = async () => {
	const errorMessages = await getZodErrorMessages();
	return createSiteSchemaBase(errorMessages);
};

export const isKubernetesSite = (site: SiteType): site is KubernetesSite => {
	return site.infrastructure === 'Kubernetes';
};

export const isDatabaseSite = (site: SiteType): site is DatabaseSite => {
	const dbInfras: DatabaseInfrastructureName[] = ['External', 'LAMP', 'Archived'];
	return dbInfras.includes(site.infrastructure as DatabaseInfrastructureName);
};

export const isNoneSite = (site: SiteType): site is NoneSite => {
	return site.infrastructure === 'Temporary';
};

export const getSitePersistence = (infrastructure: InfrastructureName): 'kubernetes' | 'database' | 'none' => {
	const infra = Object.values(INFRASTRUCTURES).find((i) => i.NAME === infrastructure);
	return infra?.PERSISTENCE || 'none';
};

export const isCreatableInfrastructure = (infrastructure: string): boolean => {
	const infra = Object.values(INFRASTRUCTURES).find((i) => i.NAME === infrastructure);
	return infra?.CREATED || false;
};
