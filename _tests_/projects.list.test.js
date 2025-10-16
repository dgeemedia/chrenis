// __tests__/projects.list.test.js
const projectsController = require('../controllers/projectsController');
const db = require('../db/connect');
const { ObjectId } = require('mongodb');

jest.mock('../db/connect');

describe('projectsController.list (GET all)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns active projects array', async () => {
    const fakeProjects = [
      { _id: new ObjectId(), slug: 'p-1', title: 'Project 1', status: 'active' },
      { _id: new ObjectId(), slug: 'p-2', title: 'Project 2', status: 'active' }
    ];

    db.getDb.mockReturnValue({
      collection: (name) => {
        if (name === 'projects') {
          return {
            find: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(fakeProjects)
            })
          };
        }
        return {};
      }
    });

    const req = {};
    const res = { json: jest.fn() };
    const next = jest.fn();

    await projectsController.list(req, res, next);

    expect(res.json).toHaveBeenCalledWith(fakeProjects);
    expect(next).not.toHaveBeenCalled();
  });
});
