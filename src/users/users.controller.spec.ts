import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { ApiResponse } from 'src/constants';
import { HttpStatus } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: [],
  };

  const mockApiResponse: ApiResponse<User> = {
    statusCode: HttpStatus.OK,
    message: 'User retrieved successfully',
    data: mockUser,
  };

  const mockUsersArrayResponse: ApiResponse<User[]> = {
    statusCode: HttpStatus.OK,
    message: 'Users retrieved successfully',
    data: [mockUser],
  };

  const mockUsersService = {
    create: jest.fn().mockResolvedValue(mockApiResponse),
    findAll: jest.fn().mockResolvedValue(mockUsersArrayResponse),
    findOne: jest.fn().mockResolvedValue(mockApiResponse),
    update: jest.fn().mockResolvedValue(mockApiResponse),
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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should return created user', async () => {
      const dto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
      };
      const result = await controller.create(dto);
      expect(result).toEqual(mockApiResponse);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = await controller.findAll();
      expect(result).toEqual(mockUsersArrayResponse);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      const result = await controller.findOne('1');
      expect(result).toEqual(mockApiResponse);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should return updated user', async () => {
      const dto: CreateUserDto = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };
      const result = await controller.update('1', dto);
      expect(result).toEqual(mockApiResponse);
      expect(service.update).toHaveBeenCalledWith(1, dto);
    });
  });
});
