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
 *     summary: Get all users (requires authentication)
 *     description: Returns a list of users. Password hashes are not included in the response.
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
 *     summary: Create a new user (register)
 *     description: Create a new user. `password` will be hashed before storage.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreate'
 *           example:
 *             name: "Jane Doe"
 *             email: "jane@example.com"
 *             password: "S3curePassword!"
 *     responses:
 *       201:
 *         description: User created (password is hashed)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error (missing/invalid fields)
 *       409:
 *         description: Conflict (email already exists)
 *       500:
 *         description: Server error
 */

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get a user by id (requires authentication)
 *     description: Returns a single user object (passwordHash excluded).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: MongoDB ObjectId of the user
 *         required: true
 *         schema:
 *           type: string
 *           example: 64a1f0e0b4c3a1d2e3f45678
 *     responses:
 *       200:
 *         description: User object (passwordHash excluded)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update a user (requires authentication)
 *     description: Update one or more fields on a user. If `password` is provided it will be hashed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: MongoDB ObjectId of the user
 *         required: true
 *         schema:
 *           type: string
 *           example: 64a1f0e0b4c3a1d2e3f45678
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Fields to update. Only include fields you want to change.
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *             example:
 *               name: "Updated Name"
 *               email: "updated@example.com"
 *     responses:
 *       200:
 *         description: Updated user (passwordHash excluded)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid id / validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete a user (requires authentication)
 *     description: Permanently removes a user. Returns 204 on success.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: MongoDB ObjectId of the user
 *         required: true
 *         schema:
 *           type: string
 *           example: 64a1f0e0b4c3a1d2e3f45678
 *     responses:
 *       204:
 *         description: User deleted (no content)
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */

router.get('/', ensureAuthenticated, ctrl.list);
router.get('/:id', ensureAuthenticated, ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ensureAuthenticated, ctrl.update);
router.delete('/:id', ensureAuthenticated, ctrl.remove);

module.exports = router;
