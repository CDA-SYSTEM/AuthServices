import { createHash } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../../../common/domain/interfaces/jwt-payload.interface';
import { RedisService } from '../../../redis/redis.service';

export interface ValidateTokenResult {
  valid: true;
  roles: string[];
  userId: string;
}

@Injectable()
export class ValidateTokenUseCase {
  private readonly refreshBlacklistPrefix = 'auth:blacklist:refresh:';
  private readonly accessBlacklistPrefix = 'auth:blacklist:access:';

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async execute(token: string): Promise<ValidateTokenResult> {
    const blacklisted = await this.isBlacklisted(token);
    if (blacklisted) {
      throw new UnauthorizedException('Token revocado');
    }

    const payload = await this.verifyAccessToken(token);

    return {
      valid: true,
      roles: [payload.role],
      userId: payload.sub,
    };
  }

  private async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Token invalido');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Token invalido o expirado');
    }
  }

  private async isBlacklisted(token: string): Promise<boolean> {
    const digest = createHash('sha256').update(token).digest('hex');
    const refreshKey = `${this.refreshBlacklistPrefix}${digest}`;
    const accessKey = `${this.accessBlacklistPrefix}${digest}`;

    const [refreshBlacklisted, accessBlacklisted] = await Promise.all([
      this.redisService.exists(refreshKey),
      this.redisService.exists(accessKey),
    ]);

    return refreshBlacklisted || accessBlacklisted;
  }
}
