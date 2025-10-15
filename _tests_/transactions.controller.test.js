// File: __tests__/transactions.controller.test.js
const transactionsController = require('../controllers/transactionsController');
const db = require('../db/connect');
const { ObjectId } = require('mongodb');

jest.mock('../db/connect');

describe('transactionsController.create', () => {
  let req, res, next, invId;
  beforeEach(() => {
    invId = new ObjectId();
    req = {
      user: { _id: new ObjectId(), role: 'user' },
      body: { investmentId: invId.toString(), amount: 10000, type: 'deposit' }
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('creates transaction for owner', async () => {
    const investments = {
      findOne: jest.fn().mockResolvedValue({ _id: invId, userId: req.user._id }),
      updateOne: jest.fn().mockResolvedValue({})
    };
    const transactions = {
      insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      findOne: jest.fn().mockResolvedValue({ _id: new ObjectId(), amount: 10000 })
    };

    db.getDb.mockReturnValue({
      collection: (name) => {
        if (name === 'investments') return investments;
        if (name === 'transactions') return transactions;
        return { find: jest.fn().mockReturnValue({ toArray: async () => [] }) };
      }
    });

    await transactionsController.create(req, res, next);

    expect(investments.findOne).toHaveBeenCalled();
    expect(transactions.insertOne).toHaveBeenCalled();
    const txInserted = transactions.insertOne.mock.calls[0][0];
    expect(txInserted).toMatchObject({ type: 'deposit', amount: 10000 });
    expect(investments.updateOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.any(Object));
  });

  test('forbids create by non-owner', async () => {
    const investments = { findOne: jest.fn().mockResolvedValue({ _id: invId, userId: new ObjectId() }) }; // different owner
    db.getDb.mockReturnValue({ collection: (name) => investments });

    await transactionsController.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
