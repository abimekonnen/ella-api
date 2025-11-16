import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { ApiResponse, ProductStatus } from 'src/constants';
import { HttpStatus } from '@nestjs/common';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  const mockTransaction: Transaction = {
    id: 1,
    user: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [],
    },
    product: {
      id: 1,
      name: 'Sample Product',
      price: 100,
      quantity: 10,
      status: ProductStatus.FOR_SALE,
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [],
    },
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    create: jest.fn().mockResolvedValue({
      statusCode: HttpStatus.CREATED,
      message: 'Transaction created successfully',
      data: mockTransaction,
    }),
    findAll: jest.fn().mockResolvedValue({
      statusCode: HttpStatus.OK,
      message: 'Transactions retrieved successfully',
      data: [mockTransaction],
    }),
    findOne: jest.fn().mockResolvedValue({
      statusCode: HttpStatus.OK,
      message: 'Transaction retrieved successfully',
      data: mockTransaction,
    }),
    update: jest.fn().mockResolvedValue({
      statusCode: HttpStatus.OK,
      message: 'Transaction updated successfully',
      data: mockTransaction,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a transaction', async () => {
      const dto: CreateTransactionDto = {
        userId: 1,
        productId: 1,
        quantity: 2,
      };
      const result: ApiResponse<Transaction> = await controller.create(dto);
      expect(result.data).toEqual(mockTransaction);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return an array of transactions', async () => {
      const result: ApiResponse<Transaction[]> = await controller.findAll();
      expect(result.data).toEqual([mockTransaction]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single transaction', async () => {
      const result: ApiResponse<Transaction> = await controller.findOne('1');
      expect(result.data).toEqual(mockTransaction);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });
});
