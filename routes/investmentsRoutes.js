// routes/investmentsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/investmentsController');
const { ensureAuthenticated } = require('../middlewares/auth');
const role = require('../middlewares/role');

/**
 * @openapi
 * /api/investments:
 *   get:
 *     tags:
 *       - Investments
 *     summary: Get all investments
 *     description: Returns list of investments. Admins get all investments; non-admins get only their own.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of investments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Investment'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *
 *   post:
 *     tags:
 *       - Investments
 *     summary: Create an investment (authenticated)
 *     description: Create an investment for the authenticated user. Also creates a pending transaction.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvestmentCreate'
 *           example:
 *             projectId: "64b2f0e0b4c3a1d2e3f45670"
 *             amount: 15000
 *             term: "4mo"
 *     responses:
 *       201:
 *         description: Investment created with a pending transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 investment:
 *                   $ref: '#/components/schemas/Investment'
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid input / amount below minimum
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.get('/', ensureAuthenticated, ctrl.list);
router.post('/', ensureAuthenticated, ctrl.create);

/**
 * @openapi
 * /api/investments/{id}:
 *   get:
 *     tags:
 *       - Investments
 *     summary: Get an investment by ID
 *     description: Returns a single investment. Admins can fetch any investment; owners can fetch their own.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: MongoDB ObjectId of the investment
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Investment object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Investment'
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Investment not found
 *
 *   put:
 *     tags:
 *       - Investments
 *     summary: Update an investment by ID
 *     description: Update fields on an investment. Admin or owner may update (policy enforced in controller).
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
 *             allOf:
 *               - $ref: '#/components/schemas/InvestmentCreate'
 *               - type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum: ['active','matured','withdrawn','reinvested']
 *     responses:
 *       200:
 *         description: Updated investment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Investment'
 *       400:
 *         description: Invalid id / validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Investment not found
 *
 *   delete:
 *     tags:
 *       - Investments
 *     summary: Delete an investment by ID
 *     description: Deletes an investment (admin or owner). Returns 204 on success.
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
 *         description: Investment deleted (no content)
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Investment not found
 */
router.get('/:id', ensureAuthenticated, ctrl.get);
router.put('/:id', ensureAuthenticated, role && typeof role === 'function' ? role('admin') : (req, res, next) => next(), ctrl.update);
router.delete('/:id', ensureAuthenticated, role && typeof role === 'function' ? role('admin') : (req, res, next) => next(), ctrl.remove);

module.exports = router;
