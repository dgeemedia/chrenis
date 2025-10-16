// __tests__/projects.get.test.js
const projectsController = require('../controllers/projectsController');
const db = require('../db/connect');
const { ObjectId } = require('mongodb');

jest.mock('../db/connect');

describe('projectsController.get (GET one)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns a single project when id valid', async () => {
    const projectId = new ObjectId();
    const project = { _id: projectId, slug: 'mango', title: 'Mango Orchard' };

    db.getDb.mockReturnValue({
      collection: (name) => {
        if (name === 'projects') return { findOne: jest.fn().mockResolvedValue(project) };
        return {};
      }
    });

    const req = { params: { id: projectId.toString() } };
    const res = { json: jest.fn(), status: jest.fn(() => res) };
    const next = jest.fn();

    await projectsController.get(req, res, next);

    expect(res.json).toHaveBeenCalledWith(project);
    expect(next).not.toHaveBeenCalled();
  });
});
