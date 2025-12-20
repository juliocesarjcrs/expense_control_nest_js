import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { JwtUser } from '../interfaces/jwt-payload.interface';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminGuard],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    // Helper para crear mock de ExecutionContext
    const createMockExecutionContext = (
      user: JwtUser | null,
    ): ExecutionContext => {
      return {
        switchToHttp: () => ({
          getRequest: () => ({
            user,
          }),
        }),
      } as ExecutionContext;
    };

    describe('Successful Authorization', () => {
      it('should allow access for admin user (role = 1)', () => {
        const adminUser: JwtUser = {
          id: 1,
          email: 'admin@example.com',
          role: 1,
          name: 'Admin User',
        };

        const context = createMockExecutionContext(adminUser);
        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should work with different admin user IDs', () => {
        const adminUsers = [
          { id: 1, email: 'admin1@example.com', role: 1, name: 'Admin 1' },
          { id: 2, email: 'admin2@example.com', role: 1, name: 'Admin 2' },
          {
            id: 100,
            email: 'admin100@example.com',
            role: 1,
            name: 'Admin 100',
          },
        ];

        adminUsers.forEach((admin) => {
          const context = createMockExecutionContext(admin);
          const result = guard.canActivate(context);
          expect(result).toBe(true);
        });
      });
    });

    describe('Failed Authorization - Normal Users', () => {
      it('should throw ForbiddenException for normal user (role = 0)', () => {
        const normalUser: JwtUser = {
          id: 2,
          email: 'user@example.com',
          role: 0,
          name: 'Normal User',
        };

        const context = createMockExecutionContext(normalUser);

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(context)).toThrow(
          'Se requieren permisos de administrador para realizar esta acción',
        );
      });

      it('should reject users with role different than 1', () => {
        const invalidRoles = [-1, 0, 2, 3, 99];

        invalidRoles.forEach((role) => {
          const user: JwtUser = {
            id: 1,
            email: 'user@example.com',
            role: role,
            name: 'User',
          };

          const context = createMockExecutionContext(user);
          expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        });
      });
    });

    describe('Failed Authorization - No User', () => {
      it('should throw ForbiddenException when user is null', () => {
        const context = createMockExecutionContext(null);

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(context)).toThrow(
          'Usuario no autenticado',
        );
      });

      it('should throw ForbiddenException when user is undefined', () => {
        const context = {
          switchToHttp: () => ({
            getRequest: () => ({
              user: undefined,
            }),
          }),
        } as ExecutionContext;

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(context)).toThrow(
          'Usuario no autenticado',
        );
      });
    });

    describe('Error Messages', () => {
      it('should have correct error message for unauthenticated user', () => {
        const context = createMockExecutionContext(null);

        try {
          guard.canActivate(context);
          fail('Should have thrown an exception');
        } catch (error) {
          expect(error).toBeInstanceOf(ForbiddenException);
          expect(error.message).toBe('Usuario no autenticado');
        }
      });

      it('should have correct error message for non-admin user', () => {
        const normalUser: JwtUser = {
          id: 1,
          email: 'user@example.com',
          role: 0,
          name: 'User',
        };

        const context = createMockExecutionContext(normalUser);

        try {
          guard.canActivate(context);
          fail('Should have thrown an exception');
        } catch (error) {
          expect(error).toBeInstanceOf(ForbiddenException);
          expect(error.message).toBe(
            'Se requieren permisos de administrador para realizar esta acción',
          );
        }
      });
    });

    describe('Edge Cases', () => {
      it('should handle user with null role', () => {
        const userWithNullRole = {
          id: 1,
          email: 'user@example.com',
          role: null,
          name: 'User',
        } as any;

        const context = createMockExecutionContext(userWithNullRole);

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      });

      it('should handle user with string role "1"', () => {
        const userWithStringRole = {
          id: 1,
          email: 'admin@example.com',
          role: '1' as any, // TypeScript bypass para testing
          name: 'Admin',
        } as any;

        const context = createMockExecutionContext(userWithStringRole);

        // Debe fallar porque role debe ser number 1, no string "1"
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      });

      it('should handle user with boolean role', () => {
        const userWithBooleanRole = {
          id: 1,
          email: 'admin@example.com',
          role: true as any,
          name: 'Admin',
        } as any;

        const context = createMockExecutionContext(userWithBooleanRole);

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      });
    });

    describe('Integration with JwtAuthGuard', () => {
      it('should assume user is already authenticated by JwtAuthGuard', () => {
        // AdminGuard no debe validar el token
        // Solo debe verificar que el usuario (ya validado por JwtAuthGuard) tenga role = 1
        const adminUser: JwtUser = {
          id: 1,
          email: 'admin@example.com',
          role: 1,
          name: 'Admin',
        };

        const context = createMockExecutionContext(adminUser);
        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should work correctly when user was populated by JwtAuthGuard', () => {
        // Simular que JwtAuthGuard ya pobló req.user
        const userFromJwt: JwtUser = {
          id: 5,
          email: 'admin@company.com',
          role: 1,
          name: 'Company Admin',
        };

        const context = createMockExecutionContext(userFromJwt);
        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });
    });

    describe('Security', () => {
      it('should strictly check role equals 1', () => {
        const usersWithSimilarButInvalidRoles = [
          { ...{ id: 1, email: 'a@a.com', name: 'A' }, role: 1.1 },
          { ...{ id: 1, email: 'a@a.com', name: 'A' }, role: 1.0 }, // Podría pasar si es 1.0
          { ...{ id: 1, email: 'a@a.com', name: 'A' }, role: 0.9 },
        ];

        // 1.0 debe pasar (es igual a 1)
        const validContext = createMockExecutionContext({
          id: 1,
          email: 'admin@test.com',
          role: 1.0,
          name: 'Admin',
        });
        expect(guard.canActivate(validContext)).toBe(true);

        // Otros deben fallar
        usersWithSimilarButInvalidRoles.forEach((user) => {
          if (user.role !== 1.0) {
            const context = createMockExecutionContext(user as JwtUser);
            expect(() => guard.canActivate(context)).toThrow(
              ForbiddenException,
            );
          }
        });
      });

      it('should not allow privilege escalation', () => {
        // Verificar que no hay forma de bypassear la validación
        const attemptedEscalations = [
          { id: 1, email: 'hacker@evil.com', role: 2, name: 'Hacker' }, // role > 1
          { id: 1, email: 'hacker@evil.com', role: -1, name: 'Hacker' }, // role negativo
        ];

        attemptedEscalations.forEach((user) => {
          const context = createMockExecutionContext(user);
          expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        });
      });
    });
  });

  describe('Guard Behavior', () => {
    it('should return boolean or throw exception, never return Promise', () => {
      const adminUser: JwtUser = {
        id: 1,
        email: 'admin@example.com',
        role: 1,
        name: 'Admin',
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: adminUser }),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(context);

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    it('should be synchronous', () => {
      const adminUser: JwtUser = {
        id: 1,
        email: 'admin@example.com',
        role: 1,
        name: 'Admin',
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: adminUser }),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(context);

      // No debe retornar Promise
      expect(result).not.toBeInstanceOf(Promise);
      expect(result).toBe(true);
    });
  });
});
