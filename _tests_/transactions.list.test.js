// __tests__/transactions.list.test.js
const transactionsController = require('../controllers/transactionsController');
const db = require('../db/connect');
const { ObjectId } = require('mongodb');

jest.mock('../db/connect');

describe('transactionsController.list (GET all)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns transactions for admin (all transactions)', async () => {
    const txs = [
      { _id: new ObjectId(), amount: 100, type: 'deposit' },
      { _id: new ObjectId(), amount: 200, type: 'withdraw' }
    ];

    db.getDb.mockReturnValue({
      collection: (name) => {
        if (name === 'transactions') {
          return {
            find: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(txs)
            })
          };
        }
        return {};
      }
    });

    const req = { user: { _id: new ObjectId(), role: 'admin' } };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await transactionsController.list(req, res, next);

    expect(res.json).toHaveBeenCalledWith(txs);
    expect(next).not.toHaveBeenCalled();
  });
});
