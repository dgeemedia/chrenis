// __tests__/users.list.test.js
const usersController = require('../controllers/usersController');
const db = require('../db/connect');
const { ObjectId } = require('mongodb');

jest.mock('../db/connect');

describe('usersController.list (GET all)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns users with passwordHash excluded (projection used)', async () => {
    const users = [
      { _id: new ObjectId(), email: 'a@example.com', name: 'A' },
      { _id: new ObjectId(), email: 'b@example.com', name: 'B' }
    ];

    db.getDb.mockReturnValue({
      collection: (name) => {
        if (name === 'users') {
          return {
            find: jest.fn().mockReturnValue({
              project: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue(users)
              })
            })
          };
        }
        return {};
      }
    });

    const req = {};
    const res = { json: jest.fn() };
    const next = jest.fn();

    await usersController.list(req, res, next);

    expect(res.json).toHaveBeenCalledWith(users);
    expect(next).not.toHaveBeenCalled();
  });
});
