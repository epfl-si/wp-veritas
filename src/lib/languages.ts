import { PolylangLanguage } from "@/types/languages";
import { WordPressPlugins } from "@/types/site";

export function extractLanguages(plugins: WordPressPlugins): string[] {
	const polylangLanguages = plugins?.polylang?.polylang?.languages;
  
	if (!polylangLanguages || !Array.isArray(polylangLanguages)) {
		return [];
	}
  
	return polylangLanguages
		.filter((lang): lang is PolylangLanguage => 
			typeof lang === "object" && lang !== null && "locale" in lang,
		)
		.map(lang => lang.locale);
}
