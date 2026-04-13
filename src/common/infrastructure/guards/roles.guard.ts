import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../../domain/interfaces/jwt-payload.interface';
import { UserRole, ROLE_HIERARCHY } from '../../domain/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    const userRoles = this.extractUserRoles(user);

    if (userRoles.length === 0) {
      throw new ForbiddenException('Usuario no autenticado o sin rol');
    }

    const highestUserRoleLevel = Math.max(
      ...userRoles.map((role) => ROLE_HIERARCHY[role] || 0),
      0,
    );

    const hasRequiredRole = requiredRoles.some((role) => ROLE_HIERARCHY[role] <= highestUserRoleLevel);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Requiere uno de los roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }

  private extractUserRoles(user?: JwtPayload): UserRole[] {
    if (!user) {
      return [];
    }

    const roleCandidates = [
      ...(Array.isArray(user.roles) ? user.roles : []),
      ...(user.role ? [user.role] : []),
    ];

    return roleCandidates.filter((role): role is UserRole => Object.values(UserRole).includes(role as UserRole));
  }
}
