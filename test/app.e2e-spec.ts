import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { ProductStatus } from 'src/constants';
import { DataSource } from 'typeorm';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let productId: number;
  let transactionId: number;
  const userId = 1;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);

    await dataSource.query(
      'TRUNCATE TABLE "transaction" RESTART IDENTITY CASCADE',
    );
    await dataSource.query('TRUNCATE TABLE "product" RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await app.close();
  });

  // ================= Root Endpoint =================
  it('GET / should return Hello World', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(HttpStatus.OK)
      .expect('Hello World!');
  });

  // ================= Products =================
  it('POST /products should create a product', async () => {
    const res = await request(app.getHttpServer()).post('/products').send({
      name: 'Test Product',
      price: 10,
      quantity: 100,
      status: ProductStatus.FOR_SALE,
    });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.name).toBe('Test Product');
    productId = res.body.data.id;
  });

  it('GET /products should return all products', async () => {
    const res = await request(app.getHttpServer())
      .get('/products')
      .expect(HttpStatus.OK);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /products/:id should return a single product', async () => {
    const res = await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.id).toBe(productId);
  });

  it('PUT /products/:id should update a product', async () => {
    const res = await request(app.getHttpServer())
      .put(`/products/${productId}`)
      .send({ name: 'Updated Product', price: 15 })
      .expect(HttpStatus.OK);

    expect(res.body.data.name).toBe('Updated Product');
    expect(res.body.data.price).toBe(15);
  });

  it('GET /products/:id for non-existing product should return 404', async () => {
    await request(app.getHttpServer())
      .get('/products/9999')
      .expect(HttpStatus.NOT_FOUND);
  });

  // ================= Transactions =================
  it('POST /transactions should create a transaction', async () => {
    const res = await request(app.getHttpServer())
      .post('/transactions')
      .send({ userId, productId, quantity: 2 });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.data).toHaveProperty('id');
    transactionId = res.body.data.id;
  });

  it('GET /transactions should return all transactions', async () => {
    const res = await request(app.getHttpServer())
      .get('/transactions')
      .expect(HttpStatus.OK);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /transactions/:id should return a single transaction', async () => {
    const res = await request(app.getHttpServer())
      .get(`/transactions/${transactionId}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.id).toBe(transactionId);
  });

  it('POST /transactions with quantity exceeding stock should return 409', async () => {
    await request(app.getHttpServer())
      .post('/transactions')
      .send({ userId, productId, quantity: 9999 })
      .expect(HttpStatus.CONFLICT);
  });

  it('POST /transactions with non-existing user should return 404', async () => {
    await request(app.getHttpServer())
      .post('/transactions')
      .send({ userId: 9999, productId, quantity: 1 })
      .expect(HttpStatus.NOT_FOUND);
  });

  it('POST /transactions with non-existing product should return 404', async () => {
    await request(app.getHttpServer())
      .post('/transactions')
      .send({ userId, productId: 9999, quantity: 1 })
      .expect(HttpStatus.NOT_FOUND);
  });

  it('GET /transactions/:id for non-existing transaction should return 404', async () => {
    await request(app.getHttpServer())
      .get('/transactions/9999')
      .expect(HttpStatus.NOT_FOUND);
  });
});
