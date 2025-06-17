import { OPTIONAL_CATEGORIES, WP_CATEGORIES } from '@/constants/categories';
import { SiteType } from '@/types/site';

export function getKubernetesPluginStruct(site: SiteType) {
	const plugins = WP_CATEGORIES.DEFAULT.getPlugins(site);
	for (const cat of OPTIONAL_CATEGORIES) {
		if (site.categories.find((c) => c === cat.NAME)) {
			Object.assign(plugins, cat.getPlugins(site));
		}
	}
	return plugins;
}

export function getCategoriesFromPlugins(plugins) {
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
