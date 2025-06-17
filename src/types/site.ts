import { INFRASTRUCTURES } from '@/constants/infrastructures';
import { getZodErrorMessages, useZodErrorMessages } from '@/hooks/zod';
import { z } from 'zod';

export interface KubernetesSiteType {
	metadata: {
		uid: string;
		name: string;
		namespace: string;
		labels?: Record<string, string>;
		creationTimestamp: Date;
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
	status: {
		wordpresssite: {
			lastCronJobRuntime: string;
			plugins: Record<string, object>;
		};
	};
}

export interface SiteType {
	id: string;
	url: string;
	infrastructure: string;
	createdAt: Date;
	tagline?: string;
	title?: string;
	theme?: string;
	unitId?: number;
	languages?: string[];
	categories?: string[];
	downloadsProtectionScript?: boolean;
	tags: string[];
	ticket?: string;
	comment?: string;
}

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
	};
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

export const createSiteSchemaBase = (errorMessages: ReturnType<typeof useZodErrorMessages>) => {
	const availableInfras = Object.values(INFRASTRUCTURES)
		.filter((infra) => infra.CREATED)
		.map((infra) => infra.NAME) as [string, ...string[]];

	const baseFields = {
		infrastructure: z.enum(availableInfras, {
			errorMap: (issue, ctx) => ({
				message: issue.code === z.ZodIssueCode.invalid_enum_value ? errorMessages.invalid_enum(availableInfras) : issue.code === z.ZodIssueCode.invalid_type ? errorMessages.invalid_type : ctx.defaultError,
			}),
		}),
		url: z.string({ required_error: errorMessages.required, invalid_type_error: errorMessages.invalid_type }).url({ message: errorMessages.invalid_url }),
		ticket: z.string().optional(),
		comment: z.string().optional(),
	};

	const persistenceFields = {
		tagline: z.string({ required_error: errorMessages.required, invalid_type_error: errorMessages.invalid_type }).min(3, { message: errorMessages.too_small(3) }),
		title: z.string({ required_error: errorMessages.required, invalid_type_error: errorMessages.invalid_type }).min(3, { message: errorMessages.too_small(3) }),
		theme: z.string({ required_error: errorMessages.required, invalid_type_error: errorMessages.invalid_type }).min(1, { message: errorMessages.too_small(1) }),
		languages: z.array(z.string()).min(1, { message: errorMessages.too_small(1) }),
		categories: z.array(z.string()).min(1, { message: errorMessages.too_small(1) }),
		unitId: z.number({ required_error: errorMessages.required, invalid_type_error: errorMessages.invalid_type }).positive({ message: errorMessages.too_small(1) }),
		downloadsProtectionScript: z.boolean().optional(),
	};

	return z.discriminatedUnion('infrastructure', [z.object({ ...baseFields, ...persistenceFields, infrastructure: z.literal(INFRASTRUCTURES.KUBERNETES.PERSISTENCE) }), ...availableInfras.filter((name) => name !== INFRASTRUCTURES.KUBERNETES.PERSISTENCE).map((name) => z.object({ ...baseFields, infrastructure: z.literal(name) }))]);
};

export const siteSchema = (errorMessages: ReturnType<typeof useZodErrorMessages>) => {
	return createSiteSchemaBase(errorMessages);
};

export const createSiteSchema = async () => {
	const errorMessages = await getZodErrorMessages();
	return createSiteSchemaBase(errorMessages);
};

export type SiteFormType = z.infer<ReturnType<typeof siteSchema>>;
