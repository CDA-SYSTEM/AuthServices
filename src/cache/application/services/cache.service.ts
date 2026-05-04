import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';

@Injectable()
export class CacheService {
  private readonly defaultTtlSeconds = 60;

  constructor(private readonly redisService: RedisService) {}

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const normalizedTtlSeconds = ttlSeconds && ttlSeconds > 0 ? ttlSeconds : this.defaultTtlSeconds;
    await this.redisService.set(key, JSON.stringify(value), normalizedTtlSeconds);
  }

  async get<T>(key: string): Promise<T | null> {
    const cachedValue = await this.redisService.get(key);

    if (cachedValue === null) {
      return null;
    }

    try {
      return JSON.parse(cachedValue) as T;
    } catch {
      return cachedValue as T;
    }
  }

  async delete(key: string): Promise<boolean> {
    const removedCount = await this.redisService.del(key);
    return removedCount > 0;
  }

  async invalidate(key: string): Promise<boolean> {
    return this.delete(key);
  }
}