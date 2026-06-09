import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './application/services/auth.service';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { AdminPersonnelController } from './infrastructure/controllers/admin-personnel.controller';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { RolesGuard } from '../common/infrastructure/guards/roles.guard';
import { USER_REPOSITORY } from './domain/ports/user-repository.port';
import { UserEntity } from './infrastructure/persistence/entities/user.entity';
import { UserRepositoryAdapter } from './infrastructure/persistence/user-repository.adapter';
import { RoleEntity } from './infrastructure/persistence/entities/role.entity';
import { AuthAccountEntity } from './infrastructure/persistence/entities/auth-account.entity';
import { IdentificationTypeEntity } from './infrastructure/persistence/entities/identification-type.entity';
import { FindUserByIdUseCase } from './application/use-cases/find-user-by-id.use-case';
import { SearchUsersUseCase } from './application/use-cases/search-users.use-case';
import { ValidateTokenUseCase } from './application/use-cases/validate-token.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { GetUsersUseCase } from './application/use-cases/get-users.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { GetRolesUseCase } from './application/use-cases/get-roles.use-case';
import { UserSeedService } from './infrastructure/seeds/user-seed.service';
import { AUTH_ACCOUNT_REPOSITORY } from './domain/ports/auth-account-repository.port';
import { AuthAccountRepositoryAdapter } from './infrastructure/persistence/auth-account-repository.adapter';
import { ROLE_REPOSITORY } from './domain/ports/role-repository.port';
import { RoleRepositoryAdapter } from './infrastructure/persistence/role-repository.adapter';
import { GetIdentificationTypesUseCase } from './application/use-cases/get-identification-types.use-case';
import { IDENTIFICATION_TYPE_REPOSITORY } from './domain/ports/identification-type-repository.port';
import { IdentificationTypeRepositoryAdapter } from './infrastructure/persistence/identification-type-repository.adapter';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { GetAuthAccountsUseCase } from './application/use-cases/get-auth-accounts.use-case';
import { UpdateUserRoleUseCase } from './application/use-cases/update-user-role.use-case';
import { UpdateRoleUseCase } from './application/use-cases/update-role.use-case';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([UserEntity, RoleEntity, AuthAccountEntity, IdentificationTypeEntity]),
  ],
  controllers: [AuthController, AdminPersonnelController],
  providers: [
    AuthService,
    JwtStrategy,
    FindUserByIdUseCase,
    SearchUsersUseCase,
    ValidateTokenUseCase,
    RegisterUserUseCase,
    GetUsersUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    GetRolesUseCase,
    GetIdentificationTypesUseCase,
    ChangePasswordUseCase,
    ResetPasswordUseCase,
    GetAuthAccountsUseCase,
    UpdateUserRoleUseCase,
    UpdateRoleUseCase,
    UserSeedService,
    RolesGuard,
    UserRepositoryAdapter,
    AuthAccountRepositoryAdapter,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepositoryAdapter,
    },
    {
      provide: AUTH_ACCOUNT_REPOSITORY,
      useClass: AuthAccountRepositoryAdapter,
    },
    RoleRepositoryAdapter,
    {
      provide: ROLE_REPOSITORY,
      useClass: RoleRepositoryAdapter,
    },
    IdentificationTypeRepositoryAdapter,
    {
      provide: IDENTIFICATION_TYPE_REPOSITORY,
      useClass: IdentificationTypeRepositoryAdapter,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
