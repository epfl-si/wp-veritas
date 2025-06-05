import { useZodErrorMessages } from '@/hooks/zod';
import { z } from 'zod';

export interface KubernetesSiteType {
	metadata: {
		uid: string;
		name: string;
		namespace: string;
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
			downloadsProtectionScript: string;
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
	tagline: string;
	title: string;
	theme: string;
	unitId: number;
	languages: string[];
	categories: string[];
	downloadsProtectionScript?: string;
	ticket?: string;
	comment?: string;
}

export const SiteSchema = (errorMessages: ReturnType<typeof useZodErrorMessages>) => {
	return z.object({
		url: z
			.string({
				required_error: errorMessages.required_error,
				invalid_type_error: errorMessages.invalid_type_error,
			})
			.url({
				message: errorMessages.invalid_url,
			}),
		tagline: z
			.string({
				required_error: errorMessages.required_error,
				invalid_type_error: errorMessages.invalid_type_error,
			})
			.min(3, {
				message: errorMessages.too_small(3),
			}),
		title: z
			.string({
				required_error: errorMessages.required_error,
				invalid_type_error: errorMessages.invalid_type_error,
			})
			.min(3, {
				message: errorMessages.too_small(3),
			}),
		theme: z
			.string({
				required_error: errorMessages.required_error,
				invalid_type_error: errorMessages.invalid_type_error,
			})
			.min(1, {
				message: errorMessages.too_small(1),
			}),
		unitId: z
			.number({
				required_error: errorMessages.required_error,
				invalid_type_error: errorMessages.invalid_type_error,
			})
			.positive({
				message: errorMessages.too_small(1),
			}),
		languages: z.array(z.string()).min(1, {
			message: errorMessages.too_small(1),
		}),
		categories: z.array(z.string()).min(1, {
			message: errorMessages.too_small(1),
		}),
		downloadsProtectionScript: z.string().optional(),
		ticket: z.string().optional(),
		comment: z.string().optional(),
	});
};

export type SiteFormType = z.infer<ReturnType<typeof SiteSchema>>;
