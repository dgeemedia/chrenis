// File: routes/usersRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usersController');
const { ensureAuthenticated } = require('../middlewares/auth');

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: "Get all users (requires authentication)"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users (passwordHash excluded)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: "Create a new user (register)"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreate'
 *     responses:
 *       201:
 *         description: User created (password is hashed)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 */

router.get('/', ensureAuthenticated, ctrl.list);
router.get('/:id', ensureAuthenticated, ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ensureAuthenticated, ctrl.update);
router.delete('/:id', ensureAuthenticated, ctrl.remove);

module.exports = router;
