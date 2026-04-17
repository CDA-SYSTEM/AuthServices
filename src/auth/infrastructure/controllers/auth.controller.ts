import { Body, Controller, HttpCode, HttpStatus, Post, Get, Patch, Delete, UseGuards, Param, Query, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from '../../../common/domain/dto/login.dto';
import { LogoutDto } from '../../../common/domain/dto/logout.dto';
import { RefreshTokenDto } from '../../../common/domain/dto/refresh-token.dto';
import { AuthService } from '../../application/services/auth.service';
import { TokenPairDto } from '../../domain/dto/token-pair.dto';
import { Roles } from '../../../common/infrastructure/decorators/roles.decorator';
import { RolesGuard } from '../../../common/infrastructure/guards/roles.guard';
import { UserRole } from '../../../common/domain/enums/user-role.enum';
import { FindUserByIdUseCase } from '../../application/use-cases/find-user-by-id.use-case';
import { SearchUsersUseCase } from '../../application/use-cases/search-users.use-case';
import { ValidateTokenResult, ValidateTokenUseCase } from '../../application/use-cases/validate-token.use-case';
import { ValidateTokenDto } from '../../domain/dto/validate-token.dto';
import { User } from '../../domain/interfaces/user.interface';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { GetUsersUseCase } from '../../application/use-cases/get-users.use-case';
import { RegisterUserDto } from '../../domain/dto/register-user.dto';
import { UpdateUserDto } from '../../domain/dto/update-user.dto';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';

interface UserOptionDto {
  id: string;
  label: string;
  role: UserRole;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly searchUsersUseCase: SearchUsersUseCase,
    private readonly validateTokenUseCase: ValidateTokenUseCase,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<TokenPairDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto): Promise<TokenPairDto> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: LogoutDto): Promise<{ message: string }> {
    return this.authService.logout(dto);
  }

  @Get('users/search')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  searchUsers(@Query('q') q: string): Promise<User[]> {
    return this.searchUsersUseCase.execute(q ?? '');
  }

  @Post('validate-token')
  @HttpCode(HttpStatus.OK)
  validateToken(@Body() dto: ValidateTokenDto): Promise<ValidateTokenResult> {
    return this.validateTokenUseCase.execute(dto.token);
  }

  @Post('register')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  register(
    @Body() dto: RegisterUserDto,
    @Request() req: any,
  ): Promise<User> {
    return this.registerUserUseCase.execute(dto, req.user.role);
  }

  @Get('users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getUsers(@Query('role') role?: UserRole): Promise<User[]> {
    return this.getUsersUseCase.execute(role);
  }

  @Get('users/inspectors')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERARIO, UserRole.INSPECTOR)
  async getInspectors(): Promise<UserOptionDto[]> {
    const users = await this.getUsersUseCase.execute(UserRole.INSPECTOR);
    return this.mapUsersToOptions(users);
  }

  @Get('users/operarios')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERARIO, UserRole.INSPECTOR)
  async getOperarios(): Promise<UserOptionDto[]> {
    const users = await this.getUsersUseCase.execute(UserRole.OPERARIO);
    return this.mapUsersToOptions(users);
  }

  @Get('users/options')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERARIO, UserRole.INSPECTOR)
  async getUserOptions(@Query('role') role: UserRole): Promise<UserOptionDto[]> {
    if (role !== UserRole.OPERARIO && role !== UserRole.INSPECTOR) {
      throw new BadRequestException('El parametro role debe ser operario o inspector');
    }

    const users = await this.getUsersUseCase.execute(role);
    return this.mapUsersToOptions(users);
  }

  @Get('users/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getUserById(@Param('id') id: string): Promise<User> {
    return this.findUserByIdUseCase.execute(id);
  }

  @Patch('users/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
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
  deleteUser(@Param('id') id: string, @Request() req: any): Promise<{ message: string }> {
    return this.deleteUserUseCase.execute(id, req.user.role);
  }

  @Get('modules/ntc-5375/checklists')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INSPECTOR)
  ntc5375ChecklistAccess(): { module: string; access: boolean } {
    return {
      module: 'ntc-5375-checklists',
      access: true,
    };
  }

  @Get('modules/recepcion')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERARIO, UserRole.INSPECTOR)
  recepcionAccess(): { module: string; access: boolean } {
    return {
      module: 'recepcion',
      access: true,
    };
  }

  private mapUsersToOptions(users: User[]): UserOptionDto[] {
    return users.map((user) => ({
      id: user.id,
      role: user.role,
      label: `${user.firstName} ${user.lastName}`.trim(),
    }));
  }
}
