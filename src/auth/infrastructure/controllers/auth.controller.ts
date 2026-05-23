import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, NotFoundException, Patch, Post, Query, Request, BadRequestException, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from '../../../common/domain/dto/login.dto';
import { LogoutDto } from '../../../common/domain/dto/logout.dto';
import { RefreshTokenDto } from '../../../common/domain/dto/refresh-token.dto';
import { AuthService } from '../../application/services/auth.service';
import { TokenPairResponseDto } from '../../domain/dto/token-pair.response.dto';
import { Roles } from '../../../common/infrastructure/decorators/roles.decorator';
import { RolesGuard } from '../../../common/infrastructure/guards/roles.guard';
import { UserRole } from '../../../common/domain/enums/user-role.enum';
import { FindUserByIdUseCase } from '../../application/use-cases/find-user-by-id.use-case';
import { SearchUsersUseCase } from '../../application/use-cases/search-users.use-case';
import { ValidateTokenResult, ValidateTokenUseCase } from '../../application/use-cases/validate-token.use-case';
import { ValidateTokenDto } from '../../domain/dto/validate-token.dto';
import { User } from '../../domain/interfaces/user.interface';
import { GetUsersUseCase } from '../../application/use-cases/get-users.use-case';
import { UpdateUserDto } from '../../domain/dto/update-user.dto';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import { ValidateTokenResponseDto } from '../../domain/dto/validate-token-response.dto';
import { UserResponseDto } from '../../domain/dto/user-response.dto';
import { UserOptionResponseDto } from '../../domain/dto/user-option.response.dto';
import { RoleResponseDto } from '../../domain/dto/role-response.dto';
import { GetRolesUseCase } from '../../application/use-cases/get-roles.use-case';
import { Role } from '../../domain/interfaces/role.interface';
import { IdentificationTypeResponseDto } from '../../domain/dto/identification-type-response.dto';
import { GetIdentificationTypesUseCase } from '../../application/use-cases/get-identification-types.use-case';
import { ErrorResponseDto } from '../../../common/domain/dto/error-response.dto';
import { ChangePasswordDto } from '../../domain/dto/change-password.dto';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { AUTH_ACCOUNT_REPOSITORY, AuthAccountRepositoryPort } from '../../domain/ports/auth-account-repository.port';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly searchUsersUseCase: SearchUsersUseCase,
    private readonly validateTokenUseCase: ValidateTokenUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly getRolesUseCase: GetRolesUseCase,
    private readonly getIdentificationTypesUseCase: GetIdentificationTypesUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    @Inject(AUTH_ACCOUNT_REPOSITORY)
    private readonly authAccountRepository: AuthAccountRepositoryPort,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesion para el portal',
    description:
      'Endpoint publico de autenticacion. Solo valida las 4 cuentas institucionales semilladas (admin, manager, inspector, operario) y retorna JWT de acceso y refresco.',
  })
  @ApiBody({
    type: LoginDto,
    required: true,
    description: 'Credenciales institucionales del CDA',
    examples: {
      admin: {
        summary: 'Login ADMIN',
        value: {
          email: 'admin@example.com',
          password: '1234',
        },
      },
      manager: {
        summary: 'Login MANAGER',
        value: {
          email: 'manager@example.com',
          password: '1234',
        },
      },
      inspector: {
        summary: 'Login INSPECTOR',
        value: {
          email: 'inspector@example.com',
          password: '1234',
        },
      },
      operario: {
        summary: 'Login OPERARIO',
        value: {
          email: 'operario@example.com',
          password: '1234',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Sesion iniciada correctamente',
    type: TokenPairResponseDto,
    content: {
      'application/json': {
        example: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZjFkMGUyYy04ZDY5LTRiZTItYTFmMi0yYjVhZDQ5N2Y0NGEiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MTU4NjYwMDAsImV4cCI6MTcxNTg2OTYwMH0.signature',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZjFkMGUyYy04ZDY5LTRiZTItYTFmMi0yYjVhZDQ5N2Y0NGEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcxNTg2NjAwMCwiZXhwIjoxNzE4NDU4MDAwfQ.signature',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales invalidas o API key invalida',
    type: ErrorResponseDto,
    content: {
      'application/json': {
        examples: {
          invalidCredentials: {
            summary: 'Credenciales invalidas',
            value: {
              statusCode: 401,
              message: 'Credenciales invalidas',
              error: 'Unauthorized',
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
  login(@Body() dto: LoginDto): Promise<TokenPairResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar sesion sin reingresar credenciales',
    description: 'Intercambia un refresh token valido por un nuevo par de tokens para mantener la experiencia del usuario continua.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados correctamente',
    type: TokenPairResponseDto,
    content: {
      'application/json': {
        example: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZjFkMGUyYy04ZDY5LTRiZTItYTFmMi0yYjVhZDQ5N2Y0NGEiLCJyb2xlIjoiTUFORUdFUiIsImlhdCI6MTcxNTg2OTkwMCwiZXhwIjoxNzE1ODczNTAwfQ.signature',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZjFkMGUyYy04ZDY5LTRiZTItYTFmMi0yYjVhZDQ5N2Y0NGEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcxNTg2OTkwMCwiZXhwIjoxNzE4NDQzMDAwfQ.signature',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalido, revocado o expirado',
    type: ErrorResponseDto,
  })
  refresh(@Body() dto: RefreshTokenDto): Promise<TokenPairResponseDto> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar sesion y revocar acceso',
    description: 'Revoca el refresh token actual y limpia la sesion en Redis para cortar el ciclo de autenticacion.',
  })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({ status: 200, description: 'Sesion cerrada correctamente' })
  @ApiResponse({ status: 401, description: 'Refresh token invalido o expirado', type: ErrorResponseDto })
  logout(@Body() dto: LogoutDto): Promise<{ message: string }> {
    return this.authService.logout(dto);
  }

  @Get('users/search')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Buscar usuarios para gestion administrativa',
    description: 'Busca usuarios por nombre, documento o correo para soporte operativo y paneles administrativos.',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Texto a buscar por nombre, documento o correo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios encontrados',
    type: UserResponseDto,
    isArray: true,
    content: {
      'application/json': {
        example: [
          {
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
        ],
      },
    },
  })
  searchUsers(@Query('q') q: string): Promise<User[]> {
    return this.searchUsersUseCase.execute(q ?? '');
  }

  @Post('validate-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar token antes de un flujo sensible',
    description: 'Verifica si un access token sigue siendo valido y devuelve los roles asociados para control de acceso o auditoria.',
  })
  @ApiBody({ type: ValidateTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token valido',
    type: ValidateTokenResponseDto,
    content: {
      'application/json': {
        example: {
          valid: true,
          roles: ['admin', 'manager'],
          userId: '8f1d0e2c-8d69-4be2-a1f2-2b5ad497f44a',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token invalido, revocado o expirado' })
  validateToken(@Body() dto: ValidateTokenDto): Promise<ValidateTokenResult> {
    return this.validateTokenUseCase.execute(dto.token);
  }

  @Get('users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Listar usuarios del sistema',
    description: 'Retorna todos los usuarios o filtra por rol para alimentar paneles de administracion y operaciones.',
  })
  @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'Filtro por rol' })
  @ApiResponse({
    status: 200,
    description: 'Listado de usuarios',
    type: UserResponseDto,
    isArray: true,
    content: {
      'application/json': {
        example: [
          {
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
          {
            id: '5c2e71f0-3a2d-4a0b-9b0d-1b0f1c8d3f71',
            identificationType: 'cc',
            identificationNumber: '9876543210',
            firstName: 'Carlos',
            lastName: 'Ruiz',
            phoneNumber: '+573105556677',
            email: 'carlos.ruiz@cda-system.com',
            role: 'operario',
            isActive: true,
            createdAt: '2026-05-16T15:20:30.000Z',
            updatedAt: '2026-05-16T15:20:30.000Z',
          },
        ],
      },
    },
  })
  getUsers(@Query('role') role?: UserRole): Promise<User[]> {
    return this.getUsersUseCase.execute(role);
  }

  @Get('users/inspectors')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERARIO, UserRole.INSPECTOR)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Obtener inspectores para dropdown',
    description: 'Devuelve una lista ligera con id, label y role lista para componentes de seleccion o filtros rapidos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Opciones de inspectores',
    type: UserOptionResponseDto,
    isArray: true,
    content: {
      'application/json': {
        example: [
          { id: '8f1d0e2c-8d69-4be2-a1f2-2b5ad497f44a', label: 'Laura Gomez', role: 'inspector' },
          { id: '2f0c6b64-8fcb-4b2e-9d79-4d4a1b7d3a55', label: 'Andres Pardo', role: 'inspector' },
        ],
      },
    },
  })
  async getInspectors(): Promise<UserOptionResponseDto[]> {
    const users = await this.getUsersUseCase.execute(UserRole.INSPECTOR);
    return this.mapUsersToOptions(users);
  }

  @Get('users/operarios')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERARIO, UserRole.INSPECTOR)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Obtener operarios para dropdown',
    description: 'Devuelve una lista ligera con id, label y role lista para componentes de seleccion o filtros rapidos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Opciones de operarios',
    type: UserOptionResponseDto,
    isArray: true,
    content: {
      'application/json': {
        example: [
          { id: '5c2e71f0-3a2d-4a0b-9b0d-1b0f1c8d3f71', label: 'Carlos Ruiz', role: 'operario' },
          { id: '6e4f2a3d-1c7e-4f3f-8c33-4c2a5f7a9c22', label: 'Sofia Herrera', role: 'operario' },
        ],
      },
    },
  })
  async getOperarios(): Promise<UserOptionResponseDto[]> {
    const users = await this.getUsersUseCase.execute(UserRole.OPERARIO);
    return this.mapUsersToOptions(users);
  }

  @Get('users/options')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERARIO, UserRole.INSPECTOR)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Obtener opciones de usuarios por rol',
    description: 'Endpoint generico para alimentar dropdowns de inspector u operario desde el gateway o front.',
  })
  @ApiQuery({ name: 'role', required: true, enum: [UserRole.OPERARIO, UserRole.INSPECTOR], description: 'Rol permitido para la lista' })
  @ApiResponse({
    status: 200,
    description: 'Opciones de usuarios',
    type: UserOptionResponseDto,
    isArray: true,
    content: {
      'application/json': {
        example: [
          { id: '8f1d0e2c-8d69-4be2-a1f2-2b5ad497f44a', label: 'Laura Gomez', role: 'inspector' },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El rol debe ser operario o inspector' })
  async getUserOptions(@Query('role') role: UserRole): Promise<UserOptionResponseDto[]> {
    if (role !== UserRole.OPERARIO && role !== UserRole.INSPECTOR) {
      throw new BadRequestException('El parametro role debe ser operario o inspector');
    }

    const users = await this.getUsersUseCase.execute(role);
    return this.mapUsersToOptions(users);
  }

  @Get('users/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Obtener usuario por id',
    description: 'Consulta el detalle de un usuario especifico para administracion, auditoria o edicion.',
  })
  @ApiParam({ name: 'id', description: 'Identificador unico del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del usuario',
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
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  getUserById(@Param('id') id: string): Promise<User> {
    return this.findUserByIdUseCase.execute(id);
  }

  @Patch('users/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Actualizar usuario',
    description: 'Permite modificar datos de un usuario. La actualizacion de roles y estado queda restringida al administrador.',
  })
  @ApiParam({ name: 'id', description: 'Identificador unico del usuario' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado',
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
          updatedAt: '2026-05-16T16:10:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos invalidos' })
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: any,
  ): Promise<User> {
    return this.updateUserUseCase.execute(id, dto, req.user.role);
  }

  @Patch('users/:id/inactivate')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Inactivar usuario',
    description: 'Marca el usuario como inactivo sin eliminar su trazabilidad historica. Ideal para bajas operativas sin perder auditoria.',
  })
  @ApiParam({ name: 'id', description: 'Identificador unico del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario inactivado',
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
          isActive: false,
          createdAt: '2026-05-16T15:20:30.000Z',
          updatedAt: '2026-05-16T16:10:00.000Z',
        },
      },
    },
  })
  inactivateUser(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<User> {
    return this.updateUserUseCase.execute(
      id,
      { isActive: false },
      req.user.role,
    );
  }

  @Delete('users/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Eliminar usuario (soft-delete)',
    description: 'Marca el usuario como inactivo (soft-delete) para preservar trazabilidad. Se recomienda usar inactivacion cuando se requiera mantener historial.',
  })
  @ApiParam({ name: 'id', description: 'Identificador unico del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario inactivado correctamente',
    content: {
      'application/json': {
        example: { message: 'Usuario inactivado correctamente' },
      },
    },
  })
  deleteUser(@Param('id') id: string, @Request() req: any): Promise<{ message: string }> {
    return this.deleteUserUseCase.execute(id, req.user.role);
  }

  @Get('modules/ntc-5375/checklists')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INSPECTOR)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Validar acceso al modulo NTC 5375',
    description: 'Endpoint de control de acceso usado por el gateway para habilitar funcionalidades de checklist.',
  })
  @ApiResponse({ status: 200, description: 'Resultado de acceso al modulo' })
  ntc5375ChecklistAccess(): { module: string; access: boolean } {
    return {
      module: 'ntc-5375-checklists',
      access: true,
    };
  }

  @Get('modules/recepcion')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERARIO, UserRole.INSPECTOR)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Validar acceso al modulo de recepcion',
    description: 'Endpoint de control de acceso usado por el gateway para habilitar el flujo de recepcion.',
  })
  @ApiResponse({ status: 200, description: 'Resultado de acceso al modulo' })
  recepcionAccess(): { module: string; access: boolean } {
    return {
      module: 'recepcion',
      access: true,
    };
  }

  @Get('roles')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Listar roles disponibles',
    description: 'Retorna todos los roles registrados en el sistema con su codigo, alcance y permisos asociados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de roles',
    type: RoleResponseDto,
    isArray: true,
    content: {
      'application/json': {
        example: [
          {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            code: 'admin',
            scope: 'Acceso total al sistema',
            permissions: 'Lectura, escritura, administracion de usuarios y configuracion',
          },
          {
            id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
            code: 'manager',
            scope: 'Gestion operativa del sistema',
            permissions: 'Lectura, escritura, gestion de usuarios operativos',
          },
        ],
      },
    },
  })
  getRoles(): Promise<Role[]> {
    return this.getRolesUseCase.execute();
  }

  @Get('identification-types')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Listar tipos de identificacion disponibles',
    description: 'Retorna todos los tipos de identificacion registrados en el sistema.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de tipos de identificacion',
    type: IdentificationTypeResponseDto,
    isArray: true,
  })
  getIdentificationTypes(): Promise<any[]> {
    return this.getIdentificationTypesUseCase.execute();
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado',
    description: 'Retorna la informacion del usuario autenticado a partir del token JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario (admin/manager desde auth_accounts retorna campos basicos; personal registrado retorna datos completos)',
    type: UserResponseDto,
    content: {
      'application/json': {
        examples: {
          fullProfile: {
            summary: 'Personal registrado (inspector/operario)',
            value: {
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
          basicProfile: {
            summary: 'Cuenta institucional (admin/manager/inspector/operario seed)',
            value: {
              id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              email: 'admin@example.com',
              role: 'admin',
              isActive: true,
              createdAt: '2026-05-16T00:00:00.000Z',
              updatedAt: '2026-05-16T00:00:00.000Z',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
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
  async getProfile(@Request() req: any): Promise<User | any> {
    try {
      return await this.findUserByIdUseCase.execute(req.user.sub);
    } catch (error) {
      if (error instanceof NotFoundException) {
        const account = await this.authAccountRepository.findById(req.user.sub);
        if (!account) throw new NotFoundException('Perfil no encontrado');
        return account;
      }
      throw error;
    }
  }

  @Patch('change-password')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Cambiar contraseña del usuario autenticado',
    description: 'Permite al usuario cambiar su propia contraseña proporcionando la actual y la nueva.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada correctamente',
    content: {
      'application/json': {
        example: { message: 'Contraseña actualizada correctamente' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos invalidos',
    content: {
      'application/json': {
        example: { statusCode: 400, message: ['La nueva contraseña debe tener al menos 8 caracteres'], error: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Contraseña actual incorrecta o no autenticado',
    content: {
      'application/json': {
        examples: {
          wrongPassword: {
            summary: 'Contraseña actual incorrecta',
            value: { statusCode: 401, message: 'Contraseña actual incorrecta', error: 'Unauthorized' },
          },
          invalidApiKey: {
            summary: 'API key invalida',
            value: { statusCode: 401, message: 'API Key inválida', error: 'Unauthorized' },
          },
        },
      },
    },
  })
  changePassword(@Body() dto: ChangePasswordDto, @Request() req: any): Promise<{ message: string }> {
    return this.changePasswordUseCase.execute(dto, req.user);
  }

  private mapUsersToOptions(users: User[]): UserOptionResponseDto[] {
    return users.map((user) => ({
      id: user.id,
      role: user.role,
      label: `${user.firstName} ${user.lastName}`.trim(),
    }));
  }
}
