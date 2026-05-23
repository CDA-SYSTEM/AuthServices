import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../../common/infrastructure/decorators/roles.decorator';
import { RolesGuard } from '../../../common/infrastructure/guards/roles.guard';
import { UserRole } from '../../../common/domain/enums/user-role.enum';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { GetAuthAccountsUseCase } from '../../application/use-cases/get-auth-accounts.use-case';
import { RegisterUserDto } from '../../domain/dto/register-user.dto';
import { UserResponseDto } from '../../domain/dto/user-response.dto';
import { AuthAccountResponseDto } from '../../domain/dto/auth-account-response.dto';
import { User } from '../../domain/interfaces/user.interface';
import { AuthAccount } from '../../domain/interfaces/auth-account.interface';
import { ErrorResponseDto } from '../../../common/domain/dto/error-response.dto';
import { ResetPasswordDto } from '../../domain/dto/reset-password.dto';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';

@ApiTags('Admin Personnel')
@Controller('admin/personnel')
export class AdminPersonnelController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly getAuthAccountsUseCase: GetAuthAccountsUseCase,
  ) {}

  @Get('auth-accounts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Listar cuentas de autenticacion',
    description:
      'Retorna todas las cuentas de autenticacion del sistema (usuarios con credenciales de inicio de sesion).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cuentas de autenticacion',
    type: [AuthAccountResponseDto],
    content: {
      'application/json': {
        example: [
          {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            email: 'admin@example.com',
            role: 'admin',
            isActive: true,
            createdAt: '2026-05-16T00:00:00.000Z',
            updatedAt: '2026-05-16T00:00:00.000Z',
          },
          {
            id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
            email: 'manager@example.com',
            role: 'manager',
            isActive: true,
            createdAt: '2026-05-16T00:00:00.000Z',
            updatedAt: '2026-05-16T00:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado o API key invalida',
    content: {
      'application/json': {
        examples: {
          unauthorized: {
            summary: 'Token faltante o invalido',
            value: { statusCode: 401, message: 'Unauthorized' },
          },
          invalidApiKey: {
            summary: 'API key invalida',
            value: { statusCode: 401, message: 'API Key inválida', error: 'Unauthorized' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async getAuthAccounts(): Promise<AuthAccount[]> {
    return this.getAuthAccountsUseCase.execute();
  }

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

  @Patch(':id/reset-password')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Restablecer contraseña de una cuenta',
    description: 'Permite a ADMIN o MANAGER restablecer la contraseña de cualquier cuenta de autenticacion.',
  })
  @ApiParam({ name: 'id', description: 'ID de la cuenta de autenticacion (auth_account)' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida correctamente',
    content: {
      'application/json': {
        example: { message: 'Contraseña restablecida correctamente' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos invalidos', type: ErrorResponseDto })
  @ApiResponse({
    status: 401,
    description: 'No autenticado o API key invalida',
    content: {
      'application/json': {
        examples: {
          unauthorized: {
            summary: 'Token faltante o invalido',
            value: { statusCode: 401, message: 'Unauthorized' },
          },
          invalidApiKey: {
            summary: 'API key invalida',
            value: { statusCode: 401, message: 'API Key inválida', error: 'Unauthorized' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({
    status: 404,
    description: 'Cuenta no encontrada',
    content: {
      'application/json': {
        example: { statusCode: 404, message: 'Cuenta no encontrada', error: 'Not Found' },
      },
    },
  })
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    return this.resetPasswordUseCase.execute(id, dto, req.user.role);
  }
}
