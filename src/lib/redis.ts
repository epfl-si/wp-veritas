import Redis from "ioredis";

class RedisCache {
	private static instance: RedisCache;
	private redis: Redis;

	private constructor() {
		this.redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
			maxRetriesPerRequest: 3,
			lazyConnect: true,
		});

		this.redis.on("error", (err) => {
			console.error("Redis connection error:", err);
		});
	}

	public static getInstance(): RedisCache {
		if (!RedisCache.instance) {
			RedisCache.instance = new RedisCache();
		}
		return RedisCache.instance;
	}

	public async set(key: string, data: unknown, ttlSeconds = 180): Promise<void> {
		try {
			await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
		} catch (error) {
			console.error("Redis set error:", error);
		}
	}

	public async get<T>(key: string): Promise<T | null> {
		try {
			const result = await this.redis.get(key);
			return result ? JSON.parse(result) : null;
		} catch (error) {
			console.error("Redis get error:", error);
			return null;
		}
	}

	public async delete(key: string): Promise<void> {
		try {
			await this.redis.del(key);
		} catch (error) {
			console.error("Redis delete error:", error);
		}
	}

	public async invalidatePattern(pattern: string): Promise<void> {
		try {
			const keys = await this.redis.keys(pattern);
			if (keys.length > 0) {
				await this.redis.del(...keys);
			}
		} catch (error) {
			console.error("Redis invalidate pattern error:", error);
		}
	}

	public async invalidateSitesCache(): Promise<void> {
		await this.invalidatePattern("*sites*");
	}

	public async invalidateTagsCache(): Promise<void> {
		await this.invalidatePattern("*tags*");
	}

	public async disconnect(): Promise<void> {
		await this.redis.disconnect();
	}
}

export const cache = RedisCache.getInstance();

export async function withCache<T>(
	cacheKey: string,
	fetchFn: () => Promise<T>,
	ttlSeconds = 480,
): Promise<T> {
	const cached = await cache.get<T>(cacheKey);
	if (cached) {
		return cached;
	}

	const result = await fetchFn();
	await cache.set(cacheKey, result, ttlSeconds);
	return result;
}
