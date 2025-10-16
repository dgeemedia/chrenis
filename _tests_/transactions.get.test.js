// __tests__/transactions.get.test.js
const transactionsController = require('../controllers/transactionsController');
const db = require('../db/connect');
const { ObjectId } = require('mongodb');

jest.mock('../db/connect');

describe('transactionsController.get (GET one)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns single transaction for owner (non-admin)', async () => {
    const txId = new ObjectId();
    const ownerId = new ObjectId();
    const tx = { _id: txId, userId: ownerId, amount: 750, type: 'deposit' };

    db.getDb.mockReturnValue({
      collection: (name) => {
        if (name === 'transactions') return { findOne: jest.fn().mockResolvedValue(tx) };
        return {};
      }
    });

    const req = { params: { id: txId.toString() }, user: { _id: ownerId, role: 'user' } };
    const res = { json: jest.fn(), status: jest.fn(() => res) };
    const next = jest.fn();

    await transactionsController.get(req, res, next);

    expect(res.json).toHaveBeenCalledWith(tx);
    expect(next).not.toHaveBeenCalled();
  });
});
