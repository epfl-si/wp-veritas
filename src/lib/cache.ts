import { LRUCache } from "lru-cache";

class AppCache {
	private static instance: AppCache;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private cache: LRUCache<string, any>;

	private constructor() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.cache = new LRUCache<string, any>({
			max: 500,
			ttl: 1000 * 60 * 3, // 3 minutes TTL
		});
	}

	public static getInstance(): AppCache {
		if (!AppCache.instance) {
			AppCache.instance = new AppCache();
		}
		return AppCache.instance;
	}

	public set<T>(key: string, data: T, ttl?: number): void {
		if (ttl) {
			this.cache.set(key, data, { ttl });
		} else {
			this.cache.set(key, data);
		}
	}

	public get<T>(key: string): T | null {
		return (this.cache.get(key) as T) || null;
	}

	public delete(key: string): boolean {
		return this.cache.delete(key);
	}

	public invalidateSitesCache(): void {
		for (const key of this.cache.keys()) {
			if (key.includes("sites") || key.includes("api-sites")) {
				this.cache.delete(key);
			}
		}
	}

	public invalidateTagsCache(): void {
		for (const key of this.cache.keys()) {
			if (key.includes("tags") || key.includes("api-tags")) {
				this.cache.delete(key);
			}
		}
	}
}

export const cache = AppCache.getInstance();

export function withCache<T>(
	cacheKey: string,
	fetchFn: () => Promise<T>,
	ttl?: number,
): Promise<T> {
	const cached = cache.get<T>(cacheKey);
	if (cached) {
		return Promise.resolve(cached);
	}

	return fetchFn().then((result) => {
		cache.set(cacheKey, result, ttl);
		return result;
	});
}