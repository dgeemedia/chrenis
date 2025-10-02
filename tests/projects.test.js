const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

beforeAll(async () => {
  // use test DB or mock
});

afterAll(async () => { await mongoose.disconnect(); });

describe('GET /api/projects', () => {
  it('returns 200 and array', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});