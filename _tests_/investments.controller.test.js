// _tests_/investments.controller.test.js
const investmentsController = require('../controllers/investmentsController');
const db = require('../db/connect'); // we'll override getDb in test
const { ObjectId } = require('mongodb');

describe('investmentsController.create', () => {
  let originalGetDb;

  beforeAll(() => {
    // stash original so other tests not using this mock can restore it if needed
    originalGetDb = db.getDb;
  });

  afterAll(() => {
    db.getDb = originalGetDb;
  });

  test('creates investment and transaction when data valid', async () => {
    // Prepare fake IDs
    const fakeUserId = new ObjectId();
    const fakeProjectId = new ObjectId();
    const fakeInvestmentId = new ObjectId();
    const fakeTransactionId = new ObjectId();

    // Mock collections
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

    // override db.getDb to return our mocked collections
    db.getDb = () => ({
      collection: (name) => {
        if (name === 'projects') return projects;
        if (name === 'investments') return investments;
        if (name === 'transactions') return transactions;
        // fallback minimal stub
        return {
          findOne: jest.fn().mockResolvedValue(null),
          insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
          updateOne: jest.fn().mockResolvedValue({}),
        };
      },
    });

    // Build req/res/next
    const req = {
      body: {
        projectId: fakeProjectId.toString(),
        amount: 5000,
        term: '4mo',
      },
      // ensure req.user exists (controller expects req.user._id)
      user: { _id: fakeUserId, role: 'user', email: 'test@example.com' },
    };

    // chainable res.status -> res.json
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    const next = jest.fn();

    // Call create
    await investmentsController.create(req, res, next);

    // Assertions
    expect(projects.findOne).toHaveBeenCalledWith({ _id: new ObjectId(req.body.projectId) });
    expect(investments.insertOne).toHaveBeenCalled(); // inserted investment
    expect(transactions.insertOne).toHaveBeenCalled(); // inserted transaction
    expect(investments.updateOne).toHaveBeenCalledWith(
      { _id: fakeInvestmentId },
      { $push: { transactions: fakeTransactionId } }
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        investment: expect.any(Object),
        transaction: expect.any(Object),
      })
    );
    // ensure next was not called (no error)
    expect(next).not.toHaveBeenCalled();
  });
});
