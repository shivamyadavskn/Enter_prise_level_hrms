import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

const isUpstash = redisUrl?.includes("upstash.io");

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  ...(isUpstash && { tls: {} }),
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err.message));

export default redis;

export const setCache = async (key, value, ttlSeconds = 300) => {
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
};

export const getCache = async (key) => {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
};

export const delCache = async (key) => {
  await redis.del(key);
};

export const blacklistToken = async (token, ttlSeconds) => {
  await redis.setex(`bl:${token}`, ttlSeconds, "1");
};

export const isTokenBlacklisted = async (token) => {
  const result = await redis.get(`bl:${token}`);
  return result === "1";
};
