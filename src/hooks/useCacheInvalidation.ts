import { cache } from "@/lib/cache";

export function invalidateAfterSiteAction() {
	cache.invalidateSitesCache();
}

export function invalidateAfterTagAction() {
	cache.invalidateTagsCache();
	cache.invalidateSitesCache(); // Sites cache contains tag data
}