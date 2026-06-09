import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Control Total del Sistema', description: 'Nuevo nombre/alcance del rol' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ example: 'Gestion de usuarios, configuracion global, auditoria completa.', description: 'Nueva descripcion de permisos del rol' })
  @IsOptional()
  @IsString()
  permissions?: string;
}
