import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './application/services/auth.service';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { RolesGuard } from '../common/infrastructure/guards/roles.guard';
import { USER_REPOSITORY } from './domain/ports/user-repository.port';
import { MockUserRepositoryAdapter } from './infrastructure/persistence/mock-user.repository';
import { InMemoryUserDataSource } from './infrastructure/persistence/in-memory-user.datasource';
import { FindUserByIdUseCase } from './application/use-cases/find-user-by-id.use-case';
import { SearchUsersUseCase } from './application/use-cases/search-users.use-case';
import { ValidateTokenUseCase } from './application/use-cases/validate-token.use-case';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    InMemoryUserDataSource,
    AuthService,
    JwtStrategy,
    FindUserByIdUseCase,
    SearchUsersUseCase,
    ValidateTokenUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: MockUserRepositoryAdapter,
    },
    MockUserRepositoryAdapter,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
