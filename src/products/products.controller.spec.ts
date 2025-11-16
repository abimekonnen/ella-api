import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';
import { ApiResponse, ProductStatus } from 'src/constants';
import { HttpStatus } from '@nestjs/common';


describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

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

  const mockService = {
    create: jest.fn().mockResolvedValue({
      statusCode: HttpStatus.CREATED,
      message: 'Product created successfully',
      data: mockProduct,
    }),
    findAll: jest.fn().mockResolvedValue({
      statusCode: HttpStatus.OK,
      message: 'Products retrieved successfully',
      data: [mockProduct],
    }),
    findOne: jest.fn().mockResolvedValue({
      statusCode: HttpStatus.OK,
      message: 'Product retrieved successfully',
      data: mockProduct,
    }),
    update: jest.fn().mockResolvedValue({
      statusCode: HttpStatus.OK,
      message: 'Product updated successfully',
      data: mockProduct,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create and return a product', async () => {
      const dto: CreateProductDto = {
        name: 'Sample Product',
        price: 100,
        quantity: 10,
      };
      const result: ApiResponse<Product> = await controller.create(dto);
      expect(result.data).toEqual(mockProduct);
      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll and return an array of products', async () => {
      const result: ApiResponse<Product[]> = await controller.findAll();
      expect(result.data).toEqual([mockProduct]);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call service.findOne and return a product', async () => {
      const result: ApiResponse<Product> = await controller.findOne('1');
      expect(result.data).toEqual(mockProduct);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should call service.update and return the updated product', async () => {
      const dto: CreateProductDto = {
        name: 'Updated Product',
        price: 120,
        quantity: 15,
      };
      const result: ApiResponse<Product> = await controller.update('1', dto);
      expect(result.data).toEqual(mockProduct);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(service.update).toHaveBeenCalledWith(1, dto);
    });
  });
});
