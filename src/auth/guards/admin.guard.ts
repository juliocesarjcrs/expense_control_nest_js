import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Guard para verificar que el usuario tenga rol de administrador
 * Debe usarse junto con JwtAuthGuard (aplicado globalmente)
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // El usuario ya fue validado por JwtAuthGuard
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Verificar si el usuario tiene rol de admin (role = 1)
    if (user.role !== 1) {
      throw new ForbiddenException('Se requieren permisos de administrador para realizar esta acción');
    }

    return true;
  }
}