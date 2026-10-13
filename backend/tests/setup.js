// tests/setup.js
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test_secret_key';
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
