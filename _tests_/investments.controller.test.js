// File: _tests_/investments.controller.test.js
const investmentsController = require('../controllers/investmentsController');
const db = require('../db/connect'); // we'll override getDb in test
const { ObjectId } = require('mongodb');

describe('investmentsController.create', () => {
  let originalGetDb;

  beforeAll(() => {
    originalGetDb = db.getDb;
  });

  afterAll(() => {
    db.getDb = originalGetDb;
  });

  test('creates investment and transaction when data valid', async () => {
    const fakeUserId = new ObjectId();
    const fakeProjectId = new ObjectId();
    const fakeInvestmentId = new ObjectId();
    const fakeTransactionId = new ObjectId();

    const projects = {
      findOne: jest.fn().mockResolvedValue({
        _id: fakeProjectId,
        minInvestment: 1000,
        roi4moPercent: 10,
        roi12moPercent: 25,
        currency: 'NGN',
        durationMonths: 4,
      }),
    };

    const investments = {
      insertOne: jest.fn().mockResolvedValue({ insertedId: fakeInvestmentId }),
      findOne: jest.fn().mockResolvedValue({
        _id: fakeInvestmentId,
        userId: fakeUserId,
        projectId: fakeProjectId,
        amount: 5000,
        status: 'active',
        transactions: [],
      }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    const transactions = {
      insertOne: jest.fn().mockResolvedValue({ insertedId: fakeTransactionId }),
      findOne: jest.fn().mockResolvedValue({
        _id: fakeTransactionId,
        userId: fakeUserId,
        investmentId: fakeInvestmentId,
        type: 'deposit',
        amount: 5000,
        status: 'pending',
      }),
    };

    db.getDb = () => ({
      collection: (name) => {
        if (name === 'projects') return projects;
        if (name === 'investments') return investments;
        if (name === 'transactions') return transactions;
        return {
          findOne: jest.fn().mockResolvedValue(null),
          insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
          updateOne: jest.fn().mockResolvedValue({}),
        };
      },
    });

    const req = {
      body: {
        projectId: fakeProjectId.toString(),
        amount: 5000,
        term: '4mo',
      },
      user: { _id: fakeUserId, role: 'user', email: 'test@example.com' },
    };

    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    const next = jest.fn();

    await investmentsController.create(req, res, next);

    expect(projects.findOne).toHaveBeenCalledWith({ _id: new ObjectId(req.body.projectId) });
    expect(investments.insertOne).toHaveBeenCalled();
    const insertedArg = investments.insertOne.mock.calls[0][0];
    expect(typeof insertedArg).toBe('object');

    // assert inserted doc has at least 7 fields
    const keyCount = Object.keys(insertedArg).length;
    expect(keyCount).toBeGreaterThanOrEqual(7);

    expect(transactions.insertOne).toHaveBeenCalled();
    const txArg = transactions.insertOne.mock.calls[0][0];
    expect(txArg).toMatchObject({ type: 'deposit', amount: 5000 });

    expect(investments.updateOne).toHaveBeenCalled();
    const updateCall = investments.updateOne.mock.calls[0];
    expect(updateCall).toBeDefined();
    expect(updateCall[1]).toHaveProperty('$push');
    expect(updateCall[1].$push).toHaveProperty('transactions');
    expect(updateCall[1].$push.transactions).toEqual(fakeTransactionId);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        investment: expect.any(Object),
        transaction: expect.any(Object),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
