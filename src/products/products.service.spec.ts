import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository, QueryFailedError } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import {
  ConflictException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { ApiResponse, ProductStatus } from 'src/constants';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: Repository<Product>;

  const mockProduct: Product = {
    id: 1,
    name: 'Sample Product',
    price: 100,
    quantity: 10,
    status: ProductStatus.FOR_SALE,
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: [],
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({ ...dto })),
    save: jest.fn().mockResolvedValue(mockProduct),
    find: jest.fn().mockResolvedValue([mockProduct]),
    findOne: jest.fn().mockResolvedValue(mockProduct),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a product', async () => {
      const dto: CreateProductDto = {
        name: 'Sample Product',
        price: 100,
        quantity: 10,
        status: ProductStatus.FOR_SALE,
      };
      const result: ApiResponse<Product> = await service.create(dto);
      expect(result.data).toEqual(mockProduct);
      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate product name', async () => {
      const duplicateError = Object.assign(
        new QueryFailedError('', [], new Error()),
        { code: '23505' },
      ) as unknown as Error;

      jest.spyOn(repository, 'save').mockRejectedValueOnce(duplicateError);

      const dto: CreateProductDto = {
        name: 'Sample Product',
        price: 100,
        quantity: 10,
        status: ProductStatus.FOR_SALE,
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return array of products', async () => {
      const result: ApiResponse<Product[]> = await service.findAll();
      expect(result.data).toEqual([mockProduct]);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(repository.find).toHaveBeenCalledWith({
        relations: ['transactions'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a product', async () => {
      const result: ApiResponse<Product> = await service.findOne(1);
      expect(result.data).toEqual(mockProduct);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['transactions'],
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return a product', async () => {
      const dto: CreateProductDto = {
        name: 'Updated Product',
        price: 150,
        quantity: 5,
        status: ProductStatus.FOR_SALE,
      };
      const result: ApiResponse<Product> = await service.update(1, dto);
      expect(result.data).toEqual(mockProduct);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);
      const dto: CreateProductDto = {
        name: 'Updated Product',
        price: 150,
        quantity: 5,
        status: ProductStatus.FOR_SALE,
      };
      await expect(service.update(1, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate product name', async () => {
      const duplicateError = Object.assign(
        new QueryFailedError('', [], new Error()),
        { code: '23505' },
      ) as unknown as Error;

      jest.spyOn(repository, 'save').mockRejectedValueOnce(duplicateError);

      const dto: CreateProductDto = {
        name: 'Updated Product',
        price: 150,
        quantity: 5,
        status: ProductStatus.FOR_SALE,
      };
      await expect(service.update(1, dto)).rejects.toThrow(ConflictException);
    });
  });
});
