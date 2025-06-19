import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export const useZodErrorMessages = () => {
	const t = useTranslations("validation");

	return {
		required: t("required"),
		invalid_string: t("invalidString"),
		invalid_type: t("invalidType"),
		too_small: (min: number) => t("tooSmall", { min }),
		too_big: (max: number) => t("tooBig", { max }),
		invalid_url: t("url"),
		invalid_enum: (options: string[]) => t("invalidEnum", { options: options.join(", ") }),
	};
};

export const getZodErrorMessages = async () => {
	const t = await getTranslations("validation");

	return {
		required: t("required"),
		invalid_string: t("invalidString"),
		invalid_type: t("invalidType"),
		too_small: (min: number) => t("tooSmall", { min }),
		too_big: (max: number) => t("tooBig", { max }),
		invalid_url: t("url"),
		invalid_enum: (options: string[]) => t("invalidEnum", { options: options.join(", ") }),
	};
};
