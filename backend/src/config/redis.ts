import { Redis } from "ioredis";

import { env } from "./env.js";

export interface RouteCacheClient {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
}

class MemoryCacheClient implements RouteCacheClient {
  private readonly storage = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const record = this.storage.get(key);
    if (!record) {
      return null;
    }

    if (record.expiresAt < Date.now()) {
      this.storage.delete(key);
      return null;
    }

    return record.value;
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    this.storage.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
  }
}

const memoryCache = new MemoryCacheClient();

function createRedisClient() {
  if (!env.REDIS_URL) {
    return null;
  }

  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  client.on("error", (error: unknown) => {
    console.error("[redis] error", error);
  });

  return client;
}

const redis = createRedisClient();

export const routeCacheClient: RouteCacheClient = {
  async get(key: string) {
    if (!redis) {
      return await memoryCache.get(key);
    }

    try {
      if (redis.status === "wait") {
        await redis.connect();
      }
      return await redis.get(key);
    } catch {
      return await memoryCache.get(key);
    }
  },

  async setex(key: string, seconds: number, value: string) {
    if (!redis) {
      await memoryCache.setex(key, seconds, value);
      return;
    }

    try {
      if (redis.status === "wait") {
        await redis.connect();
      }
      await redis.setex(key, seconds, value);
    } catch {
      await memoryCache.setex(key, seconds, value);
    }
  },
};
