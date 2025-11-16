import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, QueryFailedError } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import {
  ConflictException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { ApiResponse } from 'src/constants';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: [],
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({ ...dto })),
    save: jest.fn().mockResolvedValue(mockUser),
    preload: jest.fn(),
    find: jest.fn().mockResolvedValue([mockUser]),
    findOne: jest.fn().mockResolvedValue(mockUser),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a user', async () => {
      const dto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
      };
      const result: ApiResponse<User> = await service.create(dto);

      expect(result.data).toEqual(mockUser);
      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate email', async () => {
      const duplicateError = Object.assign(
        new QueryFailedError('', [], new Error('duplicate key')),
        { code: '23505' },
      ) as unknown as Error;

      jest.spyOn(repository, 'save').mockRejectedValueOnce(duplicateError);

      const dto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
      };
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      const result: ApiResponse<User[]> = await service.findAll();

      expect(result.data).toEqual([mockUser]);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(repository.find).toHaveBeenCalledWith({
        relations: ['transactions'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const result: ApiResponse<User> = await service.findOne(1);

      expect(result.data).toEqual(mockUser);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['transactions'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const dto: CreateUserDto = { name: 'Jane Doe', email: 'jane@example.com' };

    it('should update and return a user', async () => {
      const dto: CreateUserDto = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      jest.spyOn(repository, 'preload').mockImplementation(async (input) => {
        if (input.id !== mockUser.id) return undefined;
        return {
          ...mockUser,
          ...input,
          transactions: mockUser.transactions,
        } as User;
      });

      jest.spyOn(repository, 'save').mockImplementation(
        async (user) =>
          ({
            ...user,
            updatedAt: new Date(), // simulate save updating updatedAt
          }) as User,
      );

      const result = await service.update(1, dto);

      const expectedUser = {
        ...mockUser,
        ...dto,
        transactions: mockUser.transactions,
        updatedAt: expect.any(Date), // don't compare exact date
      };

      expect(result.data).toEqual(expect.objectContaining(expectedUser));
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(repository.preload).toHaveBeenCalledWith({
        id: 1,
        ...dto,
        updatedAt: expect.any(Date),
      });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(repository, 'preload').mockResolvedValueOnce(undefined);
      await expect(service.update(1, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate email', async () => {
      jest.spyOn(repository, 'preload').mockResolvedValue({
        ...mockUser,
        ...dto,
        transactions: mockUser.transactions,
      } as User);

      const duplicateError = Object.assign(
        new QueryFailedError('', [], new Error('duplicate key')),
        { code: '23505' },
      ) as unknown as Error;

      jest.spyOn(repository, 'save').mockRejectedValueOnce(duplicateError);

      await expect(service.update(1, dto)).rejects.toThrow(ConflictException);
    });
  });
});
