// File: routes/investmentsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/investmentsController');
const { ensureAuthenticated } = require('../middlewares/auth');

router.get('/', ensureAuthenticated, ctrl.list);
router.get('/:id', ensureAuthenticated, ctrl.get);
router.post('/', ensureAuthenticated, ctrl.create);

module.exports = router;
