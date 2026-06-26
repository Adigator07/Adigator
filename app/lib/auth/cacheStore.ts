/**
 * Auth rate-limit / lockout storage — Upstash REST, Redis (ioredis), or in-memory fallback.
 */

type CacheStore = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<void>;
  del(...keys: string[]): Promise<void>;
  ttl(key: string): Promise<number>;
};

type MemoryEntry = { value: string; expiresAt: number };

const memoryStore = new Map<string, MemoryEntry>();

function pruneMemory() {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt <= now) memoryStore.delete(key);
  }
}

const memoryCache: CacheStore = {
  async get(key) {
    pruneMemory();
    const entry = memoryStore.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  },
  async set(key, value, ttlSeconds) {
    memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  },
  async incr(key) {
    pruneMemory();
    const current = await memoryCache.get(key);
    const next = (current ? Number.parseInt(current, 10) : 0) + 1;
    const entry = memoryStore.get(key);
    const ttlMs = entry ? entry.expiresAt - Date.now() : 3600_000;
    memoryStore.set(key, {
      value: String(next),
      expiresAt: Date.now() + Math.max(ttlMs, 1000),
    });
    return next;
  },
  async expire(key, ttlSeconds) {
    const value = await memoryCache.get(key);
    if (value == null) return;
    memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  },
  async del(...keys) {
    keys.forEach((key) => memoryStore.delete(key));
  },
  async ttl(key) {
    const entry = memoryStore.get(key);
    if (!entry) return -2;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  },
};

class UpstashRestStore implements CacheStore {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  private async command<T>(parts: (string | number)[]): Promise<T> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parts),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Upstash command failed: ${res.status}`);
    const payload = (await res.json()) as { result: T };
    return payload.result;
  }

  async get(key: string) {
    const result = await this.command<string | null>(["GET", key]);
    return result;
  }

  async set(key: string, value: string, ttlSeconds: number) {
    await this.command(["SET", key, value, "EX", ttlSeconds]);
  }

  async incr(key: string) {
    return await this.command<number>(["INCR", key]);
  }

  async expire(key: string, ttlSeconds: number) {
    await this.command(["EXPIRE", key, ttlSeconds]);
  }

  async del(...keys: string[]) {
    if (keys.length === 0) return;
    await this.command(["DEL", ...keys]);
  }

  async ttl(key: string) {
    return await this.command<number>(["TTL", key]);
  }
}

class IoredisStore implements CacheStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly redis: any) {}

  async get(key: string) {
    return await this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number) {
    await this.redis.set(key, value, "EX", ttlSeconds);
  }

  async incr(key: string) {
    return await this.redis.incr(key);
  }

  async expire(key: string, ttlSeconds: number) {
    await this.redis.expire(key, ttlSeconds);
  }

  async del(...keys: string[]) {
    if (keys.length === 0) return;
    await this.redis.del(...keys);
  }

  async ttl(key: string) {
    return await this.redis.ttl(key);
  }
}

let storePromise: Promise<CacheStore> | null = null;

export async function getAuthCacheStore(): Promise<CacheStore> {
  if (storePromise) return storePromise;

  storePromise = (async () => {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (upstashUrl && upstashToken) {
      return new UpstashRestStore(upstashUrl, upstashToken);
    }

    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        const Redis = (await import("ioredis")).default;
        const redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          connectTimeout: 3000,
        });
        await redis.connect();
        return new IoredisStore(redis);
      } catch (error) {
        console.warn("[auth-cache] Redis unavailable, using in-memory store:", error);
      }
    }

    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[auth-cache] No UPSTASH_REDIS_REST_URL or REDIS_URL — login rate limits use per-instance memory only.",
      );
    }
    return memoryCache;
  })();

  return storePromise;
}
