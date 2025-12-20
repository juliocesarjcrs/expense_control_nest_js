import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login-dto';
import { ForgotPasswordDto } from './dto/forgot-password-dto';
import { CheckCodeDto } from './dto/check-code-dto';
import { RecoveryPasswordDto } from './dto/recovery-password-dto';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let mailService: MailService;

  // Mock data
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: '$2b$10$hashedPassword',
    role: 0,
    recoveryCode: null,
    createdAt: new Date(),
    image: null,
    categories: [], // Relación con categorías (vacía en tests)
  };

  const mockAdminUser = {
    ...mockUser,
    id: 2,
    email: 'admin@example.com',
    name: 'Admin User',
    role: 1,
  };

  // Mock services
  const mockUsersService = {
    findOneEmail: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    getHash: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockMailService = {
    sendUserCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get<MailService>(MailService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return access token and safe user on successful login', async () => {
      const mockToken = 'jwt.token.here';
      mockUsersService.findOneEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(loginDto);

      // Verificar estructura del resultado
      expect(result.access_token).toBe(mockToken);
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.name).toBe(mockUser.name);
      expect(result.user.role).toBe(mockUser.role);

      // Verificar que NO se incluyan datos sensibles
      expect('password' in result.user).toBe(false);
      expect('recoveryCode' in result.user).toBe(false);

      expect(mockUsersService.findOneEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
    });

    it('should throw HttpException when user is not found', async () => {
      mockUsersService.findOneEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException(
          'Email or password incorrect',
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(mockUsersService.findOneEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
    });

    it('should throw HttpException when password is incorrect', async () => {
      mockUsersService.findOneEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException(
          'Email or password incorrect',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should work for admin users', async () => {
      const mockToken = 'admin.jwt.token';
      mockUsersService.findOneEmail.mockResolvedValue(mockAdminUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login({
        email: mockAdminUser.email,
        password: 'adminPass',
      });

      expect(result.user.role).toBe(1);
      expect(result.access_token).toBe(mockToken);
    });
  });

  describe('getTokenForUser', () => {
    it('should create JWT with correct payload structure', () => {
      const mockToken = 'jwt.token.here';
      mockJwtService.sign.mockReturnValue(mockToken);

      const token = service.getTokenForUser(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        name: mockUser.name,
      });
      expect(token).toBe(mockToken);
    });

    it('should NOT include password in JWT payload', () => {
      mockJwtService.sign.mockReturnValue('token');

      service.getTokenForUser(mockUser);

      const signCall = mockJwtService.sign.mock.calls[0][0];
      expect(signCall).not.toHaveProperty('password');
      expect(signCall).not.toHaveProperty('recoveryCode');
    });

    it('should include correct role for admin users', () => {
      mockJwtService.sign.mockReturnValue('admin.token');

      service.getTokenForUser(mockAdminUser);

      const signCall = mockJwtService.sign.mock.calls[0][0];
      expect(signCall.role).toBe(1);
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'test@example.com',
    };

    it('should generate recovery code and send email', async () => {
      const updatedUser = { ...mockUser, recoveryCode: 1234 };
      mockUsersService.findOneEmail.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(updatedUser);
      mockMailService.sendUserCode.mockResolvedValue('email sent');

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.user).toBeDefined();
      expect(result.email).toBe('email sent');

      // Verificar que no se incluyan datos sensibles
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('recoveryCode');

      expect(mockUsersService.update).toHaveBeenCalled();
      expect(mockMailService.sendUserCode).toHaveBeenCalledWith(
        mockUser,
        expect.any(Number),
      );
    });

    it('should generate recovery code between 1000 and 9999', async () => {
      const updatedUser = { ...mockUser, recoveryCode: 1234 };
      mockUsersService.findOneEmail.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(updatedUser);
      mockMailService.sendUserCode.mockResolvedValue('email sent');

      await service.forgotPassword(forgotPasswordDto);

      const updateCall = mockUsersService.update.mock.calls[0][1];
      expect(updateCall.recoveryCode).toBeGreaterThanOrEqual(1000);
      expect(updateCall.recoveryCode).toBeLessThanOrEqual(9999);
    });

    it('should throw HttpException when email not found', async () => {
      mockUsersService.findOneEmail.mockResolvedValue(null);

      await expect(service.forgotPassword(forgotPasswordDto)).rejects.toThrow(
        new HttpException('Email not found', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('checkRecoveryCode', () => {
    const checkCodeDto: CheckCodeDto = {
      recoveryCode: '1234',
    };

    it('should return checkCode true when code is correct', async () => {
      const userWithCode = { ...mockUser, recoveryCode: 1234 };
      mockUsersService.findOne.mockResolvedValue(userWithCode);

      const result = await service.checkRecoveryCode(1, checkCodeDto);

      expect(result).toEqual({ checkCode: true });
      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw HttpException when user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.checkRecoveryCode(1, checkCodeDto)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.UNAUTHORIZED),
      );
    });

    it('should throw HttpException when recovery code is incorrect', async () => {
      const userWithCode = { ...mockUser, recoveryCode: 5678 };
      mockUsersService.findOne.mockResolvedValue(userWithCode);

      await expect(service.checkRecoveryCode(1, checkCodeDto)).rejects.toThrow(
        new HttpException(
          'Código expiró o es incorrecto',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should handle string recovery code correctly', async () => {
      const userWithCode = { ...mockUser, recoveryCode: 1234 };
      mockUsersService.findOne.mockResolvedValue(userWithCode);

      const result = await service.checkRecoveryCode(1, {
        recoveryCode: '1234',
      });

      expect(result.checkCode).toBe(true);
    });
  });

  describe('setPasswordRecovery', () => {
    const recoveryPasswordDto: RecoveryPasswordDto = {
      password: 'newPassword123',
    };

    it('should update password and return safe user', async () => {
      const hashedPassword = '$2b$10$newHashedPassword';
      const updatedUser = {
        ...mockUser,
        password: hashedPassword,
        recoveryCode: null,
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.getHash.mockResolvedValue(hashedPassword);
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await service.setPasswordRecovery(1, recoveryPasswordDto);

      expect(result.user).toBeDefined();

      // Verificar que no se incluyan datos sensibles
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('recoveryCode');

      expect(mockUsersService.getHash).toHaveBeenCalledWith('newPassword123');
      expect(mockUsersService.update).toHaveBeenCalled();
    });

    it('should throw HttpException when user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(
        service.setPasswordRecovery(999, recoveryPasswordDto),
      ).rejects.toThrow(
        new HttpException('User not found', HttpStatus.UNAUTHORIZED),
      );
    });

    it('should hash the new password', async () => {
      const hashedPassword = '$2b$10$newHashedPassword';
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.getHash.mockResolvedValue(hashedPassword);
      mockUsersService.update.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      await service.setPasswordRecovery(1, recoveryPasswordDto);

      expect(mockUsersService.getHash).toHaveBeenCalledWith('newPassword123');
    });
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const plainPassword = 'password123';
      const userWithPlainPass = { ...mockUser, password: plainPassword };
      mockUsersService.findOneEmail.mockResolvedValue(userWithPlainPass);

      const result = await service.validateUser(
        'test@example.com',
        plainPassword,
      );

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(mockUser.email);
    });

    it('should return null when user not found', async () => {
      mockUsersService.findOneEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'wrong@example.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      mockUsersService.findOneEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'test@example.com',
        'wrongPassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('generateRandomNumber', () => {
    it('should generate number within specified range', () => {
      const min = 1000;
      const max = 9999;

      const number = service.generateRandomNumber(min, max);

      expect(number).toBeGreaterThanOrEqual(min);
      expect(number).toBeLessThan(max);
    });

    it('should generate different numbers on multiple calls', () => {
      const numbers = new Set();

      for (let i = 0; i < 10; i++) {
        numbers.add(service.generateRandomNumber(1000, 9999));
      }

      // Es muy probable que al menos haya 2 números diferentes
      expect(numbers.size).toBeGreaterThan(1);
    });
  });

  describe('Security - Data Sanitization', () => {
    it('should never return password in login response', async () => {
      mockUsersService.findOneEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      mockJwtService.sign.mockReturnValue('token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // ✅ Usar 'in' operator para verificar que la propiedad NO existe
      expect('password' in result.user).toBe(false);
    });

    it('should never return recoveryCode in login response', async () => {
      const userWithCode = { ...mockUser, recoveryCode: 1234 };
      mockUsersService.findOneEmail.mockResolvedValue(userWithCode);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      mockJwtService.sign.mockReturnValue('token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // ✅ Usar 'in' operator para verificar que la propiedad NO existe
      expect('recoveryCode' in result.user).toBe(false);
    });

    it('should never return password in forgotPassword response', async () => {
      mockUsersService.findOneEmail.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue({
        ...mockUser,
        recoveryCode: 1234,
      });
      mockMailService.sendUserCode.mockResolvedValue('sent');

      const result = await service.forgotPassword({
        email: 'test@example.com',
      });

      expect('password' in result.user).toBe(false);
    });

    it('should never return recoveryCode in forgotPassword response', async () => {
      mockUsersService.findOneEmail.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue({
        ...mockUser,
        recoveryCode: 1234,
      });
      mockMailService.sendUserCode.mockResolvedValue('sent');

      const result = await service.forgotPassword({
        email: 'test@example.com',
      });

      expect('recoveryCode' in result.user).toBe(false);
    });

    it('should never return password in setPasswordRecovery response', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.getHash.mockResolvedValue('$2b$10$newHash');
      mockUsersService.update.mockResolvedValue({
        ...mockUser,
        password: '$2b$10$newHash',
      });

      const result = await service.setPasswordRecovery(1, {
        password: 'newPass',
      });

      expect('password' in result.user).toBe(false);
    });
  });
});
