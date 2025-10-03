// File: routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const role = require('../middlewares/role');

router.get('/overview', role('admin'), (req, res) => res.json({ message: 'admin overview stub' }));

module.exports = router;
