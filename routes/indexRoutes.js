const express = require('express');
const router = express.Router();

router.use('/users', require('./usersRoutes'));
router.use('/projects', require('./projectsRoutes'));
router.use('/investments', require('./investmentsRoutes'));
router.use('/transactions', require('./transactionsRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/auth', require('./auth'));

module.exports = router;
