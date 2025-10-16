// __tests__/investments.get.test.js
const investmentsController = require('../controllers/investmentsController');
const db = require('../db/connect');
const { ObjectId } = require('mongodb');

jest.mock('../db/connect');

describe('investmentsController.get (GET one)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns single investment and includes project when present', async () => {
    const invId = new ObjectId();
    const projId = new ObjectId();
    const investment = {
      _id: invId,
      projectId: projId,
      amount: 5000,
      userId: new ObjectId()
    };
    const project = { _id: projId, title: 'Mango Farm' };

    db.getDb.mockReturnValue({
      collection: (name) => {
        if (name === 'investments') return { findOne: jest.fn().mockResolvedValue(investment) };
        if (name === 'projects') return { findOne: jest.fn().mockResolvedValue(project) };
        return {};
      }
    });

    const req = { params: { id: invId.toString() } };
    const res = { json: jest.fn(), status: jest.fn(() => res) };
    const next = jest.fn();

    await investmentsController.get(req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      _id: invId,
      project: expect.objectContaining({ title: 'Mango Farm' })
    }));
    expect(next).not.toHaveBeenCalled();
  });
});
