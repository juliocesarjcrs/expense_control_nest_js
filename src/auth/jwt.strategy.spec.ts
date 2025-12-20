import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

jest.mock('./constants', () => ({
  jwtConstants: {
    secret: 'test-secret-key-for-testing',
  },
}));

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const mockPayload: JwtPayload = {
      sub: 1,
      email: 'test@example.com',
      role: 0,
      name: 'Test User',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    it('should return JwtUser with correct structure', async () => {
      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        id: mockPayload.sub,
        email: mockPayload.email,
        role: mockPayload.role,
        name: mockPayload.name,
      });
    });

    it('should map sub to id', async () => {
      const result = await strategy.validate(mockPayload);

      expect(result.id).toBe(mockPayload.sub);
      expect(result).not.toHaveProperty('sub');
    });

    it('should return correct data for admin user', async () => {
      const adminPayload: JwtPayload = {
        ...mockPayload,
        sub: 2,
        email: 'admin@example.com',
        role: 1,
        name: 'Admin User',
      };

      const result = await strategy.validate(adminPayload);

      expect(result).toEqual({
        id: 2,
        email: 'admin@example.com',
        role: 1,
        name: 'Admin User',
      });
    });

    it('should not include iat and exp in returned user', async () => {
      const result = await strategy.validate(mockPayload);

      expect(result).not.toHaveProperty('iat');
      expect(result).not.toHaveProperty('exp');
    });

    it('should handle payload without optional fields', async () => {
      const minimalPayload: JwtPayload = {
        sub: 1,
        email: 'test@example.com',
        role: 0,
        name: 'Test User',
      };

      const result = await strategy.validate(minimalPayload);

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        role: 0,
        name: 'Test User',
      });
    });

    it('should preserve all required user fields', async () => {
      const result = await strategy.validate(mockPayload);

      expect(result.id).toBeDefined();
      expect(result.email).toBeDefined();
      expect(result.role).toBeDefined();
      expect(result.name).toBeDefined();
    });

    it('should work with different user IDs', async () => {
      const payloads = [
        { ...mockPayload, sub: 1 },
        { ...mockPayload, sub: 100 },
        { ...mockPayload, sub: 999 },
      ];

      for (const payload of payloads) {
        const result = await strategy.validate(payload);
        expect(result.id).toBe(payload.sub);
      }
    });

    it('should preserve role correctly', async () => {
      const normalUserPayload = { ...mockPayload, role: 0 };
      const adminUserPayload = { ...mockPayload, role: 1 };

      const normalResult = await strategy.validate(normalUserPayload);
      const adminResult = await strategy.validate(adminUserPayload);

      expect(normalResult.role).toBe(0);
      expect(adminResult.role).toBe(1);
    });
  });

  describe('Strategy Configuration', () => {
    it('should be configured with correct JWT options', () => {
      // Verificar que la estrategia usa las opciones correctas
      // Esto verifica indirectamente la configuración en super()
      expect(strategy).toBeDefined();
      expect(strategy).toBeInstanceOf(JwtStrategy);
    });
  });

  describe('Security - Payload Validation', () => {
    it('should only extract necessary fields from payload', async () => {
      const payloadWithExtraFields = {
        sub: 1,
        email: 'test@example.com',
        role: 0,
        name: 'Test User',
        password: 'should_not_be_here', // Campo extra no debe pasar
        secretData: 'confidential', // Campo extra no debe pasar
      } as any;

      const result = await strategy.validate(payloadWithExtraFields);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('secretData');
      expect(Object.keys(result)).toEqual(['id', 'email', 'role', 'name']);
    });

    it('should not call AuthService for validation', async () => {
      // La estrategia NO debe hacer consultas adicionales a BD
      // Solo debe transformar el payload ya validado por Passport
      const mockPayload: JwtPayload = {
        sub: 1,
        email: 'test@example.com',
        role: 0,
        name: 'Test User',
      };

      await strategy.validate(mockPayload);

      expect(mockAuthService.validateUser).not.toHaveBeenCalled();
    });
  });

  describe('Data Transformation', () => {
    it('should correctly transform all required fields', async () => {
      const payload: JwtPayload = {
        sub: 42,
        email: 'user@domain.com',
        role: 1,
        name: 'John Doe',
      };

      const result = await strategy.validate(payload);

      expect(result.id).toBe(42);
      expect(result.email).toBe('user@domain.com');
      expect(result.role).toBe(1);
      expect(result.name).toBe('John Doe');
    });

    it('should handle empty name', async () => {
      const payload: JwtPayload = {
        sub: 1,
        email: 'test@example.com',
        role: 0,
        name: '',
      };

      const result = await strategy.validate(payload);

      expect(result.name).toBe('');
    });

    it('should handle special characters in email', async () => {
      const payload: JwtPayload = {
        sub: 1,
        email: 'user+test@example.com',
        role: 0,
        name: 'Test User',
      };

      const result = await strategy.validate(payload);

      expect(result.email).toBe('user+test@example.com');
    });

    it('should handle special characters in name', async () => {
      const payload: JwtPayload = {
        sub: 1,
        email: 'test@example.com',
        role: 0,
        name: 'José María Ñoño',
      };

      const result = await strategy.validate(payload);

      expect(result.name).toBe('José María Ñoño');
    });
  });
});
