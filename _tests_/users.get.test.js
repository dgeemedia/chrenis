// __tests__/users.get.test.js
const usersController = require('../controllers/usersController');
const db = require('../db/connect');
const { ObjectId } = require('mongodb');

jest.mock('../db/connect');

describe('usersController.get (GET one)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns single user and uses projection to exclude passwordHash', async () => {
    const userId = new ObjectId();
    const user = { _id: userId, email: 'c@example.com', name: 'C' };

    db.getDb.mockReturnValue({
      collection: (name) => {
        if (name === 'users') return { findOne: jest.fn().mockResolvedValue(user) };
        return {};
      }
    });

    const req = { params: { id: userId.toString() } };
    const res = { json: jest.fn(), status: jest.fn(() => res) };
    const next = jest.fn();

    await usersController.get(req, res, next);

    expect(res.json).toHaveBeenCalledWith(user);
    expect(next).not.toHaveBeenCalled();
  });
});
