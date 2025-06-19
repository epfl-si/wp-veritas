import { KubernetesSite } from "@/types/site";
import { OPTIONAL_CATEGORIES, WP_CATEGORIES } from "@/constants/categories";

export function getCategoriesFromPlugins(plugins: Record<string, object>): string[] {
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
export function getKubernetesPluginStruct(site: KubernetesSite): Record<string, object> {
	let plugins = WP_CATEGORIES.DEFAULT.getPlugins(site);

	site.categories.forEach((category) => {
		const categoryConfig = Object.values(WP_CATEGORIES).find((cat) => cat.NAME === category);
		if (categoryConfig) {
			const categoryPlugins = categoryConfig.getPlugins(site);
			plugins = { ...plugins, ...categoryPlugins };
		}
	});

	return plugins;
}
