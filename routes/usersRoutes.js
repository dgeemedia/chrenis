// File: routes/usersRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usersController');
const { ensureAuthenticated } = require('../middlewares/auth');

router.get('/', ensureAuthenticated, ctrl.list);
router.get('/:id', ensureAuthenticated, ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ensureAuthenticated, ctrl.update);
router.delete('/:id', ensureAuthenticated, ctrl.remove);

module.exports = router;
