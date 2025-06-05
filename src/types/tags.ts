import { TAG_TYPES, TAGS } from '@/constants/tags';
import { useZodErrorMessages } from '@/hooks/zod';
import { z } from 'zod';

export interface TagType {
	id: string;
	type: string;
	nameFr: string;
	nameEn: string;
	urlFr: string;
	urlEn: string;
}

export type TagEnumType = (typeof TAGS)[number]['name'];

export const TagSchema = (errorMessages: ReturnType<typeof useZodErrorMessages>) => {
	return z.object({
		type: z.enum(TAG_TYPES, {
			required_error: errorMessages.required_error,
			invalid_type_error: errorMessages.invalid_enum(TAG_TYPES as unknown as string[]),
		}),
		nameFr: z
			.string({
				required_error: errorMessages.required_error,
				invalid_type_error: errorMessages.invalid_type_error,
			})
			.min(2, {
				message: errorMessages.too_small(2),
			})
			.max(100, {
				message: errorMessages.too_big(100),
			}),
		nameEn: z
			.string({
				required_error: errorMessages.required_error,
				invalid_type_error: errorMessages.invalid_type_error,
			})
			.min(2, {
				message: errorMessages.too_small(2),
			})
			.max(100, {
				message: errorMessages.too_big(100),
			}),
		urlFr: z
			.string({
				required_error: errorMessages.required_error,
				invalid_type_error: errorMessages.invalid_type_error,
			})
			.url({
				message: errorMessages.invalid_url,
			}),
		urlEn: z
			.string({
				required_error: errorMessages.required_error,
				invalid_type_error: errorMessages.invalid_type_error,
			})
			.url({
				message: errorMessages.invalid_url,
			}),
	});
};

export type TagFormType = z.infer<ReturnType<typeof TagSchema>>;
