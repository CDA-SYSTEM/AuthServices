import { Body, Controller, HttpCode, HttpStatus, Post, Get, Patch, Delete, UseGuards, Param, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from '../../../common/domain/dto/login.dto';
import { LogoutDto } from '../../../common/domain/dto/logout.dto';
import { RefreshTokenDto } from '../../../common/domain/dto/refresh-token.dto';
import { CreateUserDto } from '../../domain/dto/create-user.dto';
import { UpdateUserRoleDto } from '../../domain/dto/update-user-role.dto';
import { ResetPasswordDto } from '../../domain/dto/reset-password.dto';
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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly searchUsersUseCase: SearchUsersUseCase,
    private readonly validateTokenUseCase: ValidateTokenUseCase,
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

  @Get('user/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getUserById(@Param('id') id: string): Promise<User> {
    return this.findUserByIdUseCase.execute(id);
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

  // ADMIN ENDPOINTS: User and Role Management

  @Post('users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  createUser(@Body() dto: CreateUserDto): Promise<{ id: string; email: string; role: UserRole }> {
    return this.authService.createUser(dto);
  }

  @Get('users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getAllUsers(): Promise<{ id: string; email: string; role: UserRole }[]> {
    return this.authService.getAllUsers();
  }

  @Patch('users/role')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  updateUserRole(@Body() dto: UpdateUserRoleDto): Promise<{ message: string }> {
    return this.authService.updateUserRole(dto);
  }

  @Post('users/reset-password')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }

  @Delete('users/:email')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  deleteUser(@Param('email') email: string): Promise<{ message: string }> {
    return this.authService.deleteUser(email);
  }
}
