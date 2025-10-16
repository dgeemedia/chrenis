// __tests__/investments.list.test.js
const investmentsController = require('../controllers/investmentsController');
const db = require('../db/connect');
const { ObjectId } = require('mongodb');

jest.mock('../db/connect');

describe('investmentsController.list (GET all)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns investments and attaches projects for admin', async () => {
    const projId = new ObjectId();
    const investmentsList = [
      { _id: new ObjectId(), projectId: projId, amount: 1000, userId: new ObjectId() },
      { _id: new ObjectId(), amount: 2000, userId: new ObjectId() }
    ];
    const projects = [{ _id: projId, title: 'Proj A' }];

    db.getDb.mockReturnValue({
      collection: (name) => {
        if (name === 'investments') {
          return {
            find: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(investmentsList)
            })
          };
        }
        if (name === 'projects') {
          return {
            find: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(projects)
            })
          };
        }
        return {};
      }
    });

    const req = { user: { _id: new ObjectId(), role: 'admin' } };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await investmentsController.list(req, res, next);

    expect(res.json).toHaveBeenCalled();
    const returned = res.json.mock.calls[0][0];
    expect(Array.isArray(returned)).toBe(true);
    const itemWithProj = returned.find(i => i.projectId && i.project);
    expect(itemWithProj).toBeDefined();
    expect(itemWithProj.project).toMatchObject({ title: 'Proj A' });
    expect(next).not.toHaveBeenCalled();
  });
});
