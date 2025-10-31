import { KubernetesSite, WordPressPlugins } from "@/types/site";
import { OPTIONAL_CATEGORIES, WP_CATEGORIES } from "@/constants/categories";
import { getUnit } from "./api";

export function getCategoriesFromPlugins(plugins: WordPressPlugins): string[] {
	const categories = [];

	for (const category of OPTIONAL_CATEGORIES) {
		const categoryPlugins = category.getPlugins();
		const categoryPluginNames = Object.keys(categoryPlugins);
		const hasPluginFromCategory = categoryPluginNames.some((pluginName) => plugins.hasOwnProperty(pluginName));

		if (hasPluginFromCategory) {
			categories.push(category.NAME);
		}
	}

	return categories;
}

export async function getKubernetesPluginStruct(site: KubernetesSite): Promise<Record<string, object>> {
	const unitName = await getUnit(site.unitId.toString()).then(unit => unit?.name || "");
	let plugins = WP_CATEGORIES.DEFAULT.getPlugins({ ...site, unitName });

	site.categories.forEach((category) => {
		const categoryConfig = Object.values(WP_CATEGORIES).find((cat) => cat.NAME === category);
		if (categoryConfig) {
			const categoryPlugins = categoryConfig.getPlugins(site);
			plugins = { ...plugins, ...categoryPlugins };
		}
	});

	return plugins;
}
