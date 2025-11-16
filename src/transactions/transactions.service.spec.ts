import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Repository, QueryFailedError } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  ConflictException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { ApiResponse, ProductStatus } from 'src/constants';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepo: Repository<Transaction>;
  let userRepo: Repository<User>;
  let productRepo: Repository<Product>;

  const mockUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: [],
  };

  const mockProduct: Product = {
    id: 1,
    name: 'Product 1',
    price: 10,
    quantity: 100,
    status: ProductStatus.FOR_SALE,
    transactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction: Transaction = {
    id: 1,
    user: mockUser,
    product: mockProduct,
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock Repositories
  const mockTransactionRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      user: mockUser,
      product: mockProduct,
      id: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    save: jest.fn().mockResolvedValue(mockTransaction),
    find: jest.fn().mockResolvedValue([mockTransaction]),
    findOne: jest.fn().mockResolvedValue(mockTransaction),
  };

  const mockUserRepo = {
    findOne: jest.fn().mockResolvedValue(mockUser),
  };

  const mockProductRepo = {
    findOne: jest.fn().mockResolvedValue(mockProduct),
    save: jest.fn().mockResolvedValue({
      ...mockProduct,
      quantity: mockProduct.quantity - 2,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepo,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionRepo = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a transaction', async () => {
      const dto: CreateTransactionDto = {
        userId: 1,
        productId: 1,
        quantity: 2,
      };
      const result: ApiResponse<Transaction> = await service.create(dto);

      expect(result.data).toEqual(mockTransaction);
      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(transactionRepo.create).toHaveBeenCalledWith({
        user: mockUser,
        product: mockProduct,
        quantity: dto.quantity,
      });
      expect(transactionRepo.save).toHaveBeenCalled();
      expect(productRepo.findOne).toHaveBeenCalledWith({
        where: { id: dto.productId },
      });
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: dto.userId },
      });
      expect(productRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(null);
      const dto: CreateTransactionDto = {
        userId: 999,
        productId: 1,
        quantity: 2,
      };
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(productRepo, 'findOne').mockResolvedValueOnce(null);
      const dto: CreateTransactionDto = {
        userId: 1,
        productId: 999,
        quantity: 2,
      };
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if quantity exceeds stock', async () => {
      jest
        .spyOn(productRepo, 'findOne')
        .mockResolvedValueOnce({ ...mockProduct, quantity: 1 });
      const dto: CreateTransactionDto = {
        userId: 1,
        productId: 1,
        quantity: 2,
      };
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on database error', async () => {
      const error = new QueryFailedError(
        'query',
        [],
        new Error('duplicate key'),
      );
      jest.spyOn(transactionRepo, 'save').mockRejectedValueOnce(error);
      const dto: CreateTransactionDto = {
        userId: 1,
        productId: 1,
        quantity: 2,
      };
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all transactions', async () => {
      const result: ApiResponse<Transaction[]> = await service.findAll();
      expect(result.data).toEqual([mockTransaction]);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(transactionRepo.find).toHaveBeenCalledWith({
        relations: ['user', 'product'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a transaction', async () => {
      const result: ApiResponse<Transaction> = await service.findOne(1);
      expect(result.data).toEqual(mockTransaction);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(transactionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user', 'product'],
      });
    });

    it('should throw NotFoundException if transaction not found', async () => {
      jest.spyOn(transactionRepo, 'findOne').mockResolvedValueOnce(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
