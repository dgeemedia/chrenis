// routes/transactionsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/transactionsController');
const { ensureAuthenticated } = require('../middlewares/auth');
const role = require('../middlewares/role');

/**
 * @openapi
 * /api/transactions:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: List transactions (authenticated)
 *     description: Admins get all transactions; non-admins get only their own.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Create a transaction for an investment (authenticated)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - investmentId
 *               - amount
 *             properties:
 *               investmentId:
 *                 type: string
 *                 description: MongoDB ObjectId of the investment
 *               type:
 *                 type: string
 *                 enum: ['deposit','withdrawal','roi_credit','fee']
 *               amount:
 *                 type: number
 *               provider:
 *                 type: string
 *               providerRef:
 *                 type: string
 *               meta:
 *                 type: object
 *     responses:
 *       201:
 *         description: Transaction created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', ensureAuthenticated, ctrl.list);
router.post('/', ensureAuthenticated, ctrl.create);

/**
 * @openapi
 * /api/transactions/{id}:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get a transaction by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Transaction not found
 *
 *   put:
 *     tags:
 *       - Transactions
 *     summary: Update a transaction by ID
 *     description: Admins or owners may update a transaction.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: ['deposit','withdrawal','roi_credit','fee']
 *               amount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: ['pending','success','failed']
 *               provider:
 *                 type: string
 *               providerRef:
 *                 type: string
 *               meta:
 *                 type: object
 *     responses:
 *       200:
 *         description: Updated transaction
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid id / validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Transaction not found
 *
 *   delete:
 *     tags:
 *       - Transactions
 *     summary: Delete a transaction by ID
 *     description: Admins or owners may delete.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Transaction deleted (no content)
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Transaction not found
 */
router.get('/:id', ensureAuthenticated, ctrl.get);
router.put('/:id', ensureAuthenticated, role && typeof role === 'function' ? role('admin') : (req, res, next) => next(), ctrl.update);
router.delete('/:id', ensureAuthenticated, role && typeof role === 'function' ? role('admin') : (req, res, next) => next(), ctrl.remove);

module.exports = router;
