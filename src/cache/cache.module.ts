import { Module } from '@nestjs/common';
import { CacheService } from './application/services/cache.service';
import { CacheController } from './infrastructure/controllers/cache.controller';

@Module({
  controllers: [CacheController],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}