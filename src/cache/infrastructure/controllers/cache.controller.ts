import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CacheService } from '../../application/services/cache.service';
import { CacheEntryDto } from '../../domain/dto/cache-entry.dto';
import { CacheDeleteResponseDto, CacheGetResponseDto, CacheSetResponseDto } from '../../domain/dto/cache-response.dto';

@ApiTags('Cache')
@Controller('cache')
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Guardar contenido en cache',
    description: 'Almacena un objeto o lista serializable en Redis con una clave unica y TTL dinamico para reutilizar consultas costosas.',
  })
  @ApiBody({ type: CacheEntryDto })
  @ApiResponse({
    status: 201,
    description: 'Contenido almacenado en cache',
    type: CacheSetResponseDto,
    content: {
      'application/json': {
        example: {
          message: 'Cache guardado correctamente',
          key: 'auth:users:inspectors',
          ttlSeconds: 60,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async setCache(@Body() dto: CacheEntryDto): Promise<CacheSetResponseDto> {
    const ttlSeconds = dto.ttlSeconds ?? 60;
    await this.cacheService.set(dto.key, dto.value, ttlSeconds);

    return {
      message: 'Cache guardado correctamente',
      key: dto.key,
      ttlSeconds,
    };
  }

  @Get(':key')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Obtener contenido de cache',
    description: 'Recupera el valor previamente almacenado bajo una clave especifica para servir listados, catálogos o respuestas compartidas.',
  })
  @ApiParam({ name: 'key', description: 'Clave del cache a consultar' })
  @ApiResponse({
    status: 200,
    description: 'Contenido recuperado del cache',
    type: CacheGetResponseDto,
    content: {
      'application/json': {
        example: {
          key: 'auth:users:inspectors',
          value: [
            { id: '8f1d0e2c-8d69-4be2-a1f2-2b5ad497f44a', label: 'Laura Gomez', role: 'INSPECTOR' },
            { id: '2f0c6b64-8fcb-4b2e-9d79-4d4a1b7d3a55', label: 'Andres Pardo', role: 'INSPECTOR' },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'La clave no existe en cache' })
  async getCache(@Param('key') key: string): Promise<CacheGetResponseDto> {
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
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Invalidar cache',
    description: 'Elimina la entrada de cache asociada a la clave indicada para forzar una recarga en el siguiente consumo.',
  })
  @ApiParam({ name: 'key', description: 'Clave del cache a eliminar' })
  @ApiResponse({
    status: 200,
    description: 'Contenido eliminado del cache',
    type: CacheDeleteResponseDto,
    content: {
      'application/json': {
        example: {
          message: 'Cache invalidado correctamente',
          key: 'auth:users:inspectors',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'La clave no existe en cache' })
  async deleteCache(@Param('key') key: string): Promise<CacheDeleteResponseDto> {
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