// File: routes/investmentsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/investmentsController');
const { ensureAuthenticated } = require('../middlewares/auth');

/**
 * @openapi
 * /api/investments:
 *   post:
 *     tags:
 *       - Investments
 *     summary: "Create an investment for a user (authenticated)"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - amount
 *               - term
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: MongoDB ObjectId string of the project
 *               amount:
 *                 type: number
 *                 description: Amount in NGN
 *               term:
 *                 type: string
 *                 enum: [ "4mo", "12mo" ]
 *     responses:
 *       201:
 *         description: Investment created (plus a pending transaction)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 investment:
 *                   type: object
 *                 transaction:
 *                   type: object
 *       400:
 *         description: Invalid input / amount below minimum
 *       401:
 *         description: Unauthorized
 */

router.get('/', ensureAuthenticated, ctrl.list);
router.get('/:id', ensureAuthenticated, ctrl.get);
router.post('/', ensureAuthenticated, ctrl.create);

module.exports = router;
