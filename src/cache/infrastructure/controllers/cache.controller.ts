import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { CacheService } from '../../application/services/cache.service';
import { CacheEntryDto } from '../../domain/dto/cache-entry.dto';

@Controller('cache')
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async setCache(@Body() dto: CacheEntryDto): Promise<{ message: string; key: string; ttlSeconds: number }> {
    const ttlSeconds = dto.ttlSeconds ?? 60;
    await this.cacheService.set(dto.key, dto.value, ttlSeconds);

    return {
      message: 'Cache guardado correctamente',
      key: dto.key,
      ttlSeconds,
    };
  }

  @Get(':key')
  async getCache(@Param('key') key: string): Promise<{ key: string; value: unknown }> {
    const value = await this.cacheService.get<unknown>(key);

    if (value === null) {
      throw new NotFoundException(`No existe cache para la clave ${key}`);
    }

    return {
      key,
      value,
    };
  }

  @Delete(':key')
  @HttpCode(HttpStatus.OK)
  async deleteCache(@Param('key') key: string): Promise<{ message: string; key: string }> {
    const deleted = await this.cacheService.invalidate(key);

    if (!deleted) {
      throw new NotFoundException(`No existe cache para la clave ${key}`);
    }

    return {
      message: 'Cache invalidado correctamente',
      key,
    };
  }
}