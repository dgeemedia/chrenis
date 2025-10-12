// __tests__/transactions.controller.test.js
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

  test('creates transaction for owner', async () => {
    const investments = {
      findOne: jest.fn().mockResolvedValue({ _id: invId, userId: req.user._id })
    };
    const transactions = {
      insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      findOne: jest.fn().mockResolvedValue({ _id: new ObjectId(), amount: 10000 })
    };
    const investmentsUpdate = {
      updateOne: jest.fn().mockResolvedValue({})
    };

    db.getDb.mockReturnValue({
      collection: (name) => {
        if (name === 'investments') return { findOne: investments.findOne, updateOne: investmentsUpdate.updateOne };
        if (name === 'transactions') return { insertOne: transactions.insertOne, findOne: transactions.findOne };
        return { find: jest.fn().mockReturnValue({ toArray: () => [] }) };
      }
    });

    await transactionsController.create(req, res, next);

    expect(investments.findOne).toHaveBeenCalled();
    expect(transactions.insertOne).toHaveBeenCalled();
    expect(investmentsUpdate.updateOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.any(Object));
  });

  test('forbids create by non-owner', async () => {
    const investments = { findOne: jest.fn().mockResolvedValue({ _id: invId, userId: new ObjectId() }) }; // different owner
    db.getDb.mockReturnValue({ collection: (name) => investments });
    await transactionsController.create(req, res, next);
    // Should return 403
    // We expect controller to call res.status(403).json(...)
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
