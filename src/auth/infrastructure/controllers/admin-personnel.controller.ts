import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../../common/infrastructure/decorators/roles.decorator';
import { RolesGuard } from '../../../common/infrastructure/guards/roles.guard';
import { UserRole } from '../../../common/domain/enums/user-role.enum';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { RegisterUserDto } from '../../domain/dto/register-user.dto';
import { UserResponseDto } from '../../domain/dto/user-response.dto';
import { User } from '../../domain/interfaces/user.interface';
import { ErrorResponseDto } from '../../../common/domain/dto/error-response.dto';

@ApiTags('Admin Personnel')
@Controller('admin/personnel')
export class AdminPersonnelController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  @Post('register')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Registrar personal operativo',
    description:
      'Registra inspectores u operarios como personal del CDA sin crear credenciales individuales en auth_accounts.',
  })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({
    status: 201,
    description: 'Personal creado correctamente',
    type: UserResponseDto,
    content: {
      'application/json': {
        example: {
          id: '8f1d0e2c-8d69-4be2-a1f2-2b5ad497f44a',
          identificationType: 'cc',
          identificationNumber: '1234567890',
          firstName: 'Laura',
          lastName: 'Gomez',
          phoneNumber: '+573001112233',
          email: 'laura.gomez@cda-system.com',
          role: 'inspector',
          isActive: true,
          createdAt: '2026-05-16T15:20:30.000Z',
          updatedAt: '2026-05-16T15:20:30.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos invalidos o rol no permitido', type: ErrorResponseDto })
  @ApiResponse({
    status: 401,
    description: 'No autenticado o API key invalida',
    type: ErrorResponseDto,
    content: {
      'application/json': {
        examples: {
          unauthorized: {
            summary: 'Token faltante o invalido',
            value: {
              statusCode: 401,
              message: 'Unauthorized',
            },
          },
          invalidApiKey: {
            summary: 'API key invalida',
            value: {
              statusCode: 401,
              message: 'API Key inválida',
              error: 'Unauthorized',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'No autorizado para registrar personal', type: ErrorResponseDto })
  register(@Body() dto: RegisterUserDto, @Request() req: any): Promise<User> {
    return this.registerUserUseCase.execute(dto, req.user.role);
  }
}
