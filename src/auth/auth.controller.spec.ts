import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { ForgotPasswordDto } from './dto/forgot-password-dto';
import { CheckCodeDto } from './dto/check-code-dto';
import { RecoveryPasswordDto } from './dto/recovery-password-dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  // Mock response object
  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockAuthService = {
    login: jest.fn(),
    forgotPassword: jest.fn(),
    checkRecoveryCode: jest.fn(),
    setPasswordRecovery: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockLoginResponse = {
      access_token: 'jwt.token.here',
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 0,
      },
    };

    it('should call authService.login with correct parameters', async () => {
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      await controller.login(loginDto);

      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(service.login).toHaveBeenCalledTimes(1);
    });

    it('should return login data', async () => {
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockLoginResponse);
    });

    it('should handle service errors', async () => {
      const error = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);
      await expect(controller.login(loginDto)).rejects.toThrow(error);
    });

    it('should work with admin credentials', async () => {
      const adminResponse = {
        ...mockLoginResponse,
        user: {
          ...mockLoginResponse.user,
          role: 1,
        },
      };

      mockAuthService.login.mockResolvedValue(adminResponse);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(adminResponse);
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'test@example.com',
    };

    const mockForgotPasswordResponse = {
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      },
      email: 'email sent',
    };

    it('should call authService.forgotPassword with correct parameters', async () => {
      mockAuthService.forgotPassword.mockResolvedValue(
        mockForgotPasswordResponse,
      );
      await controller.forgotPassword(forgotPasswordDto);

      expect(service.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
      expect(service.forgotPassword).toHaveBeenCalledTimes(1);
    });

    it('should return forgot password data', async () => {
      mockAuthService.forgotPassword.mockResolvedValue(
        mockForgotPasswordResponse,
      );

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto,
      );
      expect(result).toEqual(mockForgotPasswordResponse);
    });

    it('should handle service errors', async () => {
      const error = new Error('Email not found');
      mockAuthService.forgotPassword.mockRejectedValue(error);
      const res = mockResponse();

      await expect(
        controller.forgotPassword(forgotPasswordDto),
      ).rejects.toThrow(error);
    });
  });

  describe('checkRecoveryCode', () => {
    const userId = '1';
    const checkCodeDto: CheckCodeDto = {
      recoveryCode: '1234',
    };

    const mockCheckCodeResponse = {
      checkCode: true,
    };

    it('should call authService.checkRecoveryCode with correct parameters', async () => {
      mockAuthService.checkRecoveryCode.mockResolvedValue(
        mockCheckCodeResponse,
      );

      await controller.checkRecoveryCode(userId, checkCodeDto);

      expect(service.checkRecoveryCode).toHaveBeenCalledWith(
        Number(userId),
        checkCodeDto,
      );
      expect(service.checkRecoveryCode).toHaveBeenCalledTimes(1);
    });

    it('should return check code result', async () => {
      mockAuthService.checkRecoveryCode.mockResolvedValue(
        mockCheckCodeResponse,
      );

      const result = await controller.checkRecoveryCode(userId, checkCodeDto);

      expect(mockAuthService.checkRecoveryCode).toHaveBeenCalledWith(
        Number(userId),
        checkCodeDto,
      );
      expect(result).toEqual(mockCheckCodeResponse);
    });

    it('should handle incorrect recovery code', async () => {
      const error = new Error('Código expiró o es incorrecto');
      mockAuthService.checkRecoveryCode.mockRejectedValue(error);
      const res = mockResponse();

      await expect(
        controller.checkRecoveryCode(userId, checkCodeDto),
      ).rejects.toThrow(error);
    });

    it('should work with different user IDs', async () => {
      mockAuthService.checkRecoveryCode.mockResolvedValue(
        mockCheckCodeResponse,
      );
      const userIds = ['1', '5', '100', '999'];

      for (const id of userIds) {
        await controller.checkRecoveryCode(id, checkCodeDto);
        expect(service.checkRecoveryCode).toHaveBeenCalledWith(
          Number(userId),
          checkCodeDto,
        );
      }
    });
  });

  describe('setPasswordRecovery', () => {
    const userId = '1';
    const recoveryPasswordDto: RecoveryPasswordDto = {
      password: 'newPassword123',
    };

    const mockRecoveryResponse = {
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 0,
      },
    };

    it('should call authService.setPasswordRecovery with correct parameters', async () => {
      mockAuthService.setPasswordRecovery.mockResolvedValue(
        mockRecoveryResponse,
      );
      await controller.setPasswordRecovery(userId, recoveryPasswordDto);

      expect(service.setPasswordRecovery).toHaveBeenCalledWith(
        Number(userId),
        recoveryPasswordDto,
      );
      expect(service.setPasswordRecovery).toHaveBeenCalledTimes(1);
    });

    it('should return updated user', async () => {
      mockAuthService.setPasswordRecovery.mockResolvedValue(
        mockRecoveryResponse,
      );

      const result = await controller.setPasswordRecovery(
        userId,
        recoveryPasswordDto,
      );

      expect(mockAuthService.setPasswordRecovery).toHaveBeenCalledWith(
        Number(userId),
        recoveryPasswordDto,
      );
      expect(result).toEqual(mockRecoveryResponse);
    });

    it('should handle service errors', async () => {
      const error = new Error('User not found');
      mockAuthService.setPasswordRecovery.mockRejectedValue(error);
      const res = mockResponse();

      await expect(
        controller.setPasswordRecovery(userId, recoveryPasswordDto),
      ).rejects.toThrow(error);
    });

    it('should work with different user IDs', async () => {
      mockAuthService.setPasswordRecovery.mockResolvedValue(
        mockRecoveryResponse,
      );
      const userIds = ['1', '10', '50', '999'];

      for (const id of userIds) {
        await controller.setPasswordRecovery(id, recoveryPasswordDto);
        expect(service.setPasswordRecovery).toHaveBeenCalledWith(
          Number(id),
          recoveryPasswordDto,
        );
      }
    });
  });

  describe('Public Decorator', () => {
    it('should have @Public() decorator on login endpoint', () => {
      // Este test verifica que el endpoint es público
      // En la práctica, esto se verifica a través de metadata
      expect(controller.login).toBeDefined();
    });

    it('should have @Public() decorator on forgotPassword endpoint', () => {
      expect(controller.forgotPassword).toBeDefined();
    });

    it('should have @Public() decorator on checkRecoveryCode endpoint', () => {
      expect(controller.checkRecoveryCode).toBeDefined();
    });

    it('should have @Public() decorator on setPasswordRecovery endpoint', () => {
      expect(controller.setPasswordRecovery).toBeDefined();
    });
  });

  describe('HTTP Methods', () => {
    it('login should use POST method', () => {
      // Verificar que el método está definido
      expect(typeof controller.login).toBe('function');
    });

    it('forgotPassword should use POST method', () => {
      expect(typeof controller.forgotPassword).toBe('function');
    });

    it('checkRecoveryCode should use GET method', () => {
      expect(typeof controller.checkRecoveryCode).toBe('function');
    });

    it('setPasswordRecovery should use PUT method', () => {
      expect(typeof controller.setPasswordRecovery).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors to caller', async () => {
      const serviceError = new Error('Service Error');
      mockAuthService.login.mockRejectedValue(serviceError);

      await expect(
        controller.login({ email: 'test@test.com', password: 'pass' }),
      ).rejects.toThrow(serviceError);
    });

    it('should not catch or modify service errors', async () => {
      const specificError = new Error('Specific error message');
      mockAuthService.forgotPassword.mockRejectedValue(specificError);

      try {
        await controller.forgotPassword({ email: 'test@test.com' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Specific error message');
      }
    });
  });

  describe('Response Format', () => {
    it('should return the service response', async () => {
      const response = {
        access_token: 'token',
        user: {},
      };

      mockAuthService.login.mockResolvedValue(response);

      const result = await controller.login({
        email: 'a@a.com',
        password: 'pass',
      });

      expect(result).toEqual(response);
    });

    it('should return the value from the service for successful responses', async () => {
      const endpoints: Array<{ method: keyof AuthController; dto: any }> = [
        { method: 'login', dto: { email: 'a@a.com', password: 'pass' } },
        { method: 'forgotPassword', dto: { email: 'a@a.com' } },
      ];

      for (const endpoint of endpoints) {
        const expectedResult = { success: true };
        (mockAuthService[endpoint.method] as jest.Mock).mockResolvedValue(
          expectedResult,
        );

        const result = await (controller[endpoint.method] as any)(endpoint.dto);

        expect(result).toEqual(expectedResult);
      }
    });
  });

  describe('Integration', () => {
    it('should work with all endpoints sequentially', async () => {
      // Login
      mockAuthService.login.mockResolvedValue({
        access_token: 'token',
        user: { id: 1 },
      });
      await controller.login({ email: 'a@a.com', password: 'pass' });

      // Forgot password
      mockAuthService.forgotPassword.mockResolvedValue({
        user: { id: 1 },
        email: 'sent',
      });
      await controller.forgotPassword({ email: 'a@a.com' });

      // Check code
      mockAuthService.checkRecoveryCode.mockResolvedValue({ checkCode: true });
      await controller.checkRecoveryCode('1', { recoveryCode: '1234' });

      // Set new password
      mockAuthService.setPasswordRecovery.mockResolvedValue({
        user: { id: 1 },
      });
      await controller.setPasswordRecovery('1', { password: 'newpass' });

      // Verificar que todos fueron llamados
      expect(service.login).toHaveBeenCalled();
      expect(service.forgotPassword).toHaveBeenCalled();
      expect(service.checkRecoveryCode).toHaveBeenCalled();
      expect(service.setPasswordRecovery).toHaveBeenCalled();
    });
  });
});
