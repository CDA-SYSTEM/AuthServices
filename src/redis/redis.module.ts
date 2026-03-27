import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './tokens/redis.tokens';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Redis => {
        const tlsEnabled =
          String(configService.get<string>('REDIS_TLS_ENABLED', 'false')).toLowerCase() === 'true';

        return new Redis({
          host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
          port: Number(configService.get<number>('REDIS_PORT', 6379)),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          db: Number(configService.get<number>('REDIS_DB', 0)),
          tls: tlsEnabled ? {} : undefined,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
        });
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
