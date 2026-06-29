import { createClient, RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`;

export const redisClient: RedisClientType = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => console.error('[Redis Client Error]', err));

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log(`[Redis] Connected successfully to: ${redisUrl}`);
  } catch (error) {
    console.error(`[Redis] Connection failed to ${redisUrl}:`, error);
    process.exit(1);
  }
};
