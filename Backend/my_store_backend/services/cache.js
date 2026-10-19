import { createHash, randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import { createClient } from 'redis';

dotenv.config();

const redisUrl = process.env.REDIS_URL?.trim();
const keyPrefix = (process.env.REDIS_KEY_PREFIX || 'coolshop').replace(/:+$/, '');
const redis = redisUrl
  ? createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 1500,
        reconnectStrategy: (retries) => Math.min(retries * 250, 3000),
      },
    })
  : null;

const inFlightLoads = new Map();
let connectionAttempt = null;
let lastRedisErrorLogAt = 0;

const logRedisError = (error) => {
  const now = Date.now();
  if (now - lastRedisErrorLogAt < 30000) return;
  lastRedisErrorLogAt = now;
  console.warn('[cache] Redis unavailable; serving requests from PostgreSQL:', error?.message || error);
};

if (redis) {
  redis.on('error', logRedisError);
  redis.on('ready', () => console.info('[cache] Redis connection ready.'));
  redis.on('end', () => console.warn('[cache] Redis connection closed; cache reads are bypassed.'));
}

export const connectCache = async () => {
  if (!redis || redis.isReady) return Boolean(redis?.isReady);
  if (connectionAttempt) return connectionAttempt;
  if (redis.isOpen) return false;

  connectionAttempt = redis.connect()
    .then(() => true)
    .catch((error) => {
      logRedisError(error);
      return false;
    })
    .finally(() => {
      connectionAttempt = null;
    });

  return connectionAttempt;
};

export const getCacheStatus = () => ({
  enabled: Boolean(redis),
  connected: Boolean(redis?.isReady),
});

const hashKey = (key) => createHash('sha256').update(String(key)).digest('hex');

const getNamespaceVersion = async (versionKey) => {
  const current = await redis.get(versionKey);
  if (current) return current;

  const generated = randomUUID();
  const created = await redis.set(versionKey, generated, { NX: true });
  if (created === 'OK') return generated;
  return await redis.get(versionKey) || randomUUID();
};

export const getOrSetCache = async (namespace, key, ttlSeconds, loader) => {
  if (!redis?.isReady) return loader();

  const versionKey = `${keyPrefix}:cache-version:${namespace}`;
  let redisKey;
  try {
    const version = await getNamespaceVersion(versionKey);
    redisKey = `${keyPrefix}:cache:${namespace}:${version}:${hashKey(key)}`;
    const cached = await redis.get(redisKey);
    if (cached !== null) {
      try {
        return JSON.parse(cached);
      } catch {
        await redis.del(redisKey);
      }
    }
  } catch (error) {
    logRedisError(error);
    return loader();
  }

  const existingLoad = inFlightLoads.get(redisKey);
  if (existingLoad) return existingLoad;

  const loadPromise = (async () => {
    const value = await loader();
    if (redis.isReady) {
      try {
        await redis.set(redisKey, JSON.stringify(value), { EX: Math.max(1, ttlSeconds) });
      } catch (error) {
        logRedisError(error);
      }
    }
    return value;
  })();

  inFlightLoads.set(redisKey, loadPromise);
  try {
    return await loadPromise;
  } finally {
    inFlightLoads.delete(redisKey);
  }
};

export const invalidateCacheNamespaces = async (...namespaces) => {
  if (!redis?.isReady || namespaces.length === 0) return;
  try {
    await Promise.all([...new Set(namespaces)].map((namespace) => (
      redis.set(`${keyPrefix}:cache-version:${namespace}`, randomUUID())
    )));
  } catch (error) {
    logRedisError(error);
  }
};

export const closeCache = async () => {
  if (!redis?.isOpen) return;
  if (!redis.isReady) {
    redis.destroy();
    return;
  }

  let timeout;
  try {
    await Promise.race([
      redis.quit(),
      new Promise((resolve) => {
        timeout = setTimeout(() => {
          redis.destroy();
          resolve();
        }, 1000);
      }),
    ]);
  } catch (error) {
    logRedisError(error);
  } finally {
    clearTimeout(timeout);
  }
};
