import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user-dto';
import { UpdatedUserDto } from './dto/updated-user-dto';
import { ChangePasswordDto } from './dto/change-password-dto';
import { RequestWithFileValidation } from 'src/files/interfaces/request-with-file-validation.interface';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    createUser: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      name: 'John',
      email: 'john@test.com',
      password: '123456',
      role: 0,
      image: '',
    };

    const createdUser = {
      id: 1,
      ...createUserDto,
      image: null,
    };

    it('should create user without image', async () => {
      mockUsersService.createUser.mockResolvedValue(createdUser);

      const result = await controller.create(undefined, createUserDto);

      expect(service.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(createdUser);
    });

    it('should add image path before calling service', async () => {
      const dto = { ...createUserDto };

      const image = {
        path: 'uploads/profile.jpg',
      } as Express.Multer.File;

      mockUsersService.createUser.mockResolvedValue({
        ...createdUser,
        image: image.path,
      });

      const result = await controller.create(image, dto);

      expect(dto.image).toBe(image.path);

      expect(service.createUser).toHaveBeenCalledWith(dto);

      expect(result.image).toBe(image.path);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Service error');

      mockUsersService.createUser.mockRejectedValue(error);

      await expect(controller.create(undefined, createUserDto)).rejects.toThrow(
        error,
      );
    });
  });

  describe('getAll', () => {
    it('should return users', async () => {
      const users = [
        {
          id: 1,
          name: 'John',
        },
        {
          id: 2,
          name: 'Jane',
        },
      ];

      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.getAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(users);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database error');

      mockUsersService.findAll.mockRejectedValue(error);

      await expect(controller.getAll()).rejects.toThrow(error);
    });
  });

  describe('findOne', () => {
    const user = {
      id: 1,
      name: 'John',
      email: 'john@test.com',
    };

    it('should convert id to number', async () => {
      mockUsersService.findOne.mockResolvedValue(user);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    });

    it('should work with different ids', async () => {
      mockUsersService.findOne.mockResolvedValue(user);

      const ids = ['1', '5', '100'];

      for (const id of ids) {
        await controller.findOne(id);

        expect(service.findOne).toHaveBeenCalledWith(Number(id));
      }
    });

    it('should propagate service errors', async () => {
      const error = new Error('Not found');

      mockUsersService.findOne.mockRejectedValue(error);

      await expect(controller.findOne('1')).rejects.toThrow(error);
    });
  });

  describe('updateUser', () => {
    const updatedUserDto: UpdatedUserDto = {
      name: 'New Name',
      email: 'new@test.com',
    };

    const updatedUser = {
      id: 1,
      ...updatedUserDto,
    };

    const req = {} as RequestWithFileValidation;

    it('should call updateProfile', async () => {
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(
        req,
        undefined,
        '1',
        updatedUserDto,
      );

      expect(service.updateProfile).toHaveBeenCalledWith(
        1,
        updatedUserDto,
        req,
        undefined,
      );

      expect(result).toEqual(updatedUser);
    });

    it('should send uploaded image to service', async () => {
      const image = {
        originalname: 'profile.jpg',
      } as Express.Multer.File;

      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      await controller.updateUser(req, image, '1', updatedUserDto);

      expect(service.updateProfile).toHaveBeenCalledWith(
        1,
        updatedUserDto,
        req,
        image,
      );
    });

    it('should propagate service errors', async () => {
      const error = new Error('Update failed');

      mockUsersService.updateProfile.mockRejectedValue(error);

      await expect(
        controller.updateUser(req, undefined, '1', updatedUserDto),
      ).rejects.toThrow(error);
    });
  });
  describe('changePassword', () => {
    const dto: ChangePasswordDto = {
      currentlyPassword: 'oldPassword',
      password: 'newPassword',
      passwordComfirm: 'newPassword',
    };

    const updatedUser = {
      id: 1,
    };

    it('should call changePassword', async () => {
      mockUsersService.changePassword.mockResolvedValue(updatedUser);

      const result = await controller.update('1', dto);

      expect(service.changePassword).toHaveBeenCalledWith(1, dto);

      expect(result).toEqual(updatedUser);
    });

    it('should convert id to number', async () => {
      mockUsersService.changePassword.mockResolvedValue(updatedUser);

      await controller.update('25', dto);

      expect(service.changePassword).toHaveBeenCalledWith(25, dto);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Password incorrect');

      mockUsersService.changePassword.mockRejectedValue(error);

      await expect(controller.update('1', dto)).rejects.toThrow(error);
    });
  });
});
