const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Product = require('../models/Product');

describe('Product API', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-product-service';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collection before each test
    await Product.deleteMany({});
  });

  describe('GET /api/v1/products', () => {
    it('should return empty array when no products exist', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should return array of products', async () => {
      const testProduct = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'Test Category'
      };

      await Product.create(testProduct);

      const res = await request(app).get('/api/v1/products');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe(testProduct.name);
    });
  });

  describe('POST /api/v1/products', () => {
    it('should create a new product', async () => {
      const testProduct = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'Test Category'
      };

      const res = await request(app)
        .post('/api/v1/products')
        .send(testProduct);

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe(testProduct.name);

      const savedProduct = await Product.findById(res.body._id);
      expect(savedProduct).toBeTruthy();
      expect(savedProduct.name).toBe(testProduct.name);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .send({});

      expect(res.statusCode).toBe(400);
    });
  });
}); 