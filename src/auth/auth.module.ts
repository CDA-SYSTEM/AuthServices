import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './application/services/auth.service';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { RolesGuard } from '../common/infrastructure/guards/roles.guard';
import { USER_REPOSITORY } from './domain/ports/user-repository.port';
import { UserEntity } from './infrastructure/persistence/entities/user.entity';
import { UserRepositoryAdapter } from './infrastructure/persistence/user-repository.adapter';
import { RoleEntity } from './infrastructure/persistence/entities/role.entity';
import { AuthAccountEntity } from './infrastructure/persistence/entities/auth-account.entity';
import { FindUserByIdUseCase } from './application/use-cases/find-user-by-id.use-case';
import { SearchUsersUseCase } from './application/use-cases/search-users.use-case';
import { ValidateTokenUseCase } from './application/use-cases/validate-token.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { GetUsersUseCase } from './application/use-cases/get-users.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { UserSeedService } from './infrastructure/seeds/user-seed.service';
import { AUTH_ACCOUNT_REPOSITORY } from './domain/ports/auth-account-repository.port';
import { AuthAccountRepositoryAdapter } from './infrastructure/persistence/auth-account-repository.adapter';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([UserEntity, RoleEntity, AuthAccountEntity]),
  ],
  controllers: [AuthController],
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
  ],
  exports: [AuthService],
})
export class AuthModule {}
