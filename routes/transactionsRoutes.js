const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/transactionsController');
const { ensureAuthenticated } = require('../middlewares/auth');

router.get('/', ensureAuthenticated, ctrl.list);

module.exports = router;
