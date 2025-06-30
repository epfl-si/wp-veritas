import { cache } from "@/lib/redis";

export function invalidateAfterSiteAction() {
	cache.invalidateSitesCache();
}

export function invalidateAfterTagAction() {
	cache.invalidateTagsCache();
	cache.invalidateSitesCache(); // Sites cache contains tag data
}
