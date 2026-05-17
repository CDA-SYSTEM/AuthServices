import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    if (request.path?.startsWith('/api/docs')) {
      return true;
    }

    const apiKey = request.headers['x-api-key'];
    const validApiKey = this.configService.get<string>('API_KEY');

    if (!validApiKey) {
      throw new UnauthorizedException('API Key no configurada en el servidor');
    }

    if (!apiKey) {
      throw new UnauthorizedException('Header x-api-key es requerido');
    }

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('API Key inválida');
    }

    return true;
  }
}
