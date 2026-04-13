import { createHash, randomUUID } from 'crypto';
import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../../../common/domain/interfaces/jwt-payload.interface';
import { LoginDto } from '../../../common/domain/dto/login.dto';
import { LogoutDto } from '../../../common/domain/dto/logout.dto';
import { RefreshTokenDto } from '../../../common/domain/dto/refresh-token.dto';
import { RedisService } from '../../../redis/redis.service';
import { TokenPairDto } from '../../domain/dto/token-pair.dto';
import { MockUser } from '../../domain/interfaces/mock-user.interface';
import { CreateUserDto } from '../../domain/dto/create-user.dto';
import { UpdateUserRoleDto } from '../../domain/dto/update-user-role.dto';
import { ResetPasswordDto } from '../../domain/dto/reset-password.dto';
import { UserRole } from '../../../common/domain/enums/user-role.enum';

@Injectable()
export class AuthService {
  private readonly sessionPrefix = 'auth:session:user:';
  private readonly refreshBlacklistPrefix = 'auth:blacklist:refresh:';
  private readonly mockUsers: MockUser[] = [
    {
      id: 'usr-001',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      password: '1234',
    },
    {
      id: 'usr-002',
      email: 'manager@example.com',
      role: UserRole.MANAGER,
      password: '1234',
    },
  ];

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<TokenPairDto> {
    const user = this.validateCredentials(dto.email, dto.password);
    const tokens = await this.issueTokenPair(user);

    await this.saveSession(user.id, tokens.refreshToken);

    return tokens;
  }

  async refresh(dto: RefreshTokenDto): Promise<TokenPairDto> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);

    const isBlacklisted = await this.redisService.exists(this.refreshBlacklistKey(dto.refreshToken));
    if (isBlacklisted) {
      throw new UnauthorizedException('Refresh token revocado');
    }

    const sessionValue = await this.redisService.get(this.userSessionKey(payload.sub));
    if (!sessionValue || sessionValue !== dto.refreshToken) {
      throw new UnauthorizedException('Refresh token no coincide con la sesión activa');
    }

    const user = this.mockUsers.find((item) => item.id === payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuario no válido');
    }

    const nextTokens = await this.issueTokenPair(user);
    await this.saveSession(user.id, nextTokens.refreshToken);

    return nextTokens;
  }

  async logout(dto: LogoutDto): Promise<{ message: string }> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const blacklistTtl = this.secondsUntil(payload.exp);

    await Promise.all([
      this.redisService.del(this.userSessionKey(payload.sub)),
      this.redisService.set(this.refreshBlacklistKey(dto.refreshToken), '1', blacklistTtl),
    ]);

    return { message: 'Sesion cerrada correctamente' };
  }

  // ADMIN METHODS: User and Role Management

  async createUser(dto: CreateUserDto): Promise<{ id: string; email: string; role: UserRole }> {
    const exists = this.mockUsers.find((u) => u.email === dto.email);
    if (exists) {
      throw new ConflictException('El usuario ya existe');
    }

    const newUser: MockUser = {
      id: `usr-${Date.now()}`,
      email: dto.email,
      role: dto.role,
      password: dto.password,
    };

    this.mockUsers.push(newUser);
    return { id: newUser.id, email: newUser.email, role: newUser.role };
  }

  async getAllUsers(): Promise<{ id: string; email: string; role: UserRole }[]> {
    return this.mockUsers.map((u) => ({ id: u.id, email: u.email, role: u.role }));
  }

  async updateUserRole(dto: UpdateUserRoleDto): Promise<{ message: string }> {
    const user = this.mockUsers.find((u) => u.email === dto.email);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.role) {
      user.role = dto.role;
    }

    return { message: `Rol actualizado a ${dto.role}` };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = this.mockUsers.find((u) => u.email === dto.email);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.password = dto.newPassword;
    return { message: 'Contraseña reiniciada correctamente' };
  }

  async deleteUser(email: string): Promise<{ message: string }> {
    const idx = this.mockUsers.findIndex((u) => u.email === email);
    if (idx === -1) {
      throw new NotFoundException('Usuario no encontrado');
    }

    this.mockUsers.splice(idx, 1);
    return { message: 'Usuario eliminado correctamente' };
  }

  private validateCredentials(email: string, password: string): MockUser {
    const user = this.mockUsers.find((candidate) => candidate.email === email);
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    return user;
  }

  private async issueTokenPair(user: MockUser): Promise<TokenPairDto> {
    const accessSecret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    const accessTtl = this.configService.get<string>('JWT_ACCESS_TTL', '15m');
    const refreshTtl = this.configService.get<string>('JWT_REFRESH_TTL', '7d');
    const accessTtlSeconds = this.durationToSeconds(accessTtl);
    const refreshTtlSeconds = this.durationToSeconds(refreshTtl);

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
      jti: randomUUID(),
    };

    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
      jti: randomUUID(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: accessTtlSeconds,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshTtlSeconds,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveSession(userId: string, refreshToken: string): Promise<void> {
    const refreshTtl = this.configService.get<string>('JWT_REFRESH_TTL', '7d');
    const ttlSeconds = this.durationToSeconds(refreshTtl);

    await this.redisService.set(this.userSessionKey(userId), refreshToken, ttlSeconds);
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token invalido para refresh');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }
  }

  private userSessionKey(userId: string): string {
    return `${this.sessionPrefix}${userId}`;
  }

  private refreshBlacklistKey(refreshToken: string): string {
    const digest = createHash('sha256').update(refreshToken).digest('hex');
    return `${this.refreshBlacklistPrefix}${digest}`;
  }

  private durationToSeconds(rawDuration: string): number {
    const normalized = rawDuration.trim().toLowerCase();
    const value = Number.parseInt(normalized, 10);

    if (normalized.endsWith('s')) {
      return value;
    }
    if (normalized.endsWith('m')) {
      return value * 60;
    }
    if (normalized.endsWith('h')) {
      return value * 60 * 60;
    }
    if (normalized.endsWith('d')) {
      return value * 60 * 60 * 24;
    }

    return Number.isFinite(value) && value > 0 ? value : 60 * 60 * 24 * 7;
  }

  private secondsUntil(expiration?: number): number {
    if (!expiration) {
      return 60;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const diff = expiration - nowInSeconds;
    return diff > 0 ? diff : 60;
  }
}
