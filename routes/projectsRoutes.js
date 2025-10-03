// File: routes/projectsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/projectsController');
const { ensureAuthenticated } = require('../middlewares/auth');
const role = require('../middlewares/role');

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ensureAuthenticated, role('admin'), ctrl.create);
router.put('/:id', ensureAuthenticated, role('admin'), ctrl.update);
router.delete('/:id', ensureAuthenticated, role('admin'), ctrl.remove);

module.exports = router;
