import { useZodErrorMessages, getZodErrorMessages } from "@/hooks/zod";
import { z } from "zod";
import { ErrorMessages } from "./error";
import { TAG_CATEGORIES, TAG_CATEGORIES_VALUES } from "@/constants/tags";
import { SiteInfrastructureType } from "./site";

export interface BaseTagType {
	id: string;
	type: string;
	nameFr: string;
	nameEn: string;
	urlFr: string;
	urlEn: string;
}

export interface TagsType extends BaseTagType {
	sites: string[];
}

export interface TagType extends BaseTagType {
	sites?: {
		id: string;
		infrastructure: SiteInfrastructureType;
		url: string;
	}[];
}

export type TagCategoryEnumType = (typeof TAG_CATEGORIES)[keyof typeof TAG_CATEGORIES]["NAME"];
export type TagCategoryType = (typeof TAG_CATEGORIES)[keyof typeof TAG_CATEGORIES];

const createTagSchemaBase = (errorMessages: ErrorMessages) => {
	return z.object({
		type: z.enum(TAG_CATEGORIES_VALUES, {
			errorMap: (issue, ctx) => {
				if (issue.code === z.ZodIssueCode.invalid_enum_value) {
					return { message: errorMessages.invalid_enum(TAG_CATEGORIES_VALUES) };
				}
				if (issue.code === z.ZodIssueCode.invalid_type) {
					return { message: errorMessages.invalid_type };
				}
				return { message: ctx.defaultError };
			},
		}),
		nameFr: z
			.string({
				required_error: errorMessages.required,
				invalid_type_error: errorMessages.invalid_string,
			})
			.min(2, {
				message: errorMessages.too_small(2),
			})
			.max(100, {
				message: errorMessages.too_big(100),
			}),
		nameEn: z
			.string({
				required_error: errorMessages.required,
				invalid_type_error: errorMessages.invalid_string,
			})
			.min(2, {
				message: errorMessages.too_small(2),
			})
			.max(100, {
				message: errorMessages.too_big(100),
			}),
		urlFr: z
			.string({
				required_error: errorMessages.required,
				invalid_type_error: errorMessages.invalid_string,
			})
			.url({
				message: errorMessages.invalid_url,
			}),
		urlEn: z
			.string({
				required_error: errorMessages.required,
				invalid_type_error: errorMessages.invalid_string,
			})
			.url({
				message: errorMessages.invalid_url,
			}),
	});
};

export const tagSchema = (errorMessages: ReturnType<typeof useZodErrorMessages>) => {
	return createTagSchemaBase(errorMessages);
};

export const createTagSchema = async () => {
	const errorMessages = await getZodErrorMessages();
	return createTagSchemaBase(errorMessages);
};

export type TagFormType = z.infer<ReturnType<typeof tagSchema>>;
