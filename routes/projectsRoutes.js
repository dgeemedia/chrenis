// File: routes/projectsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/projectsController');
const { ensureAuthenticated } = require('../middlewares/auth');
const role = require('../middlewares/role');

/**
 * @openapi
 * /api/projects:
 *   get:
 *     tags:
 *       - Projects
 *     summary: List projects
 *     description: Returns active projects. Public endpoint.
 *     responses:
 *       200:
 *         description: Array of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       500:
 *         description: Server error
 */

/**
 * @openapi
 * /api/projects:
 *   post:
 *     tags:
 *       - Projects
 *     summary: Create a project (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectCreate'
 *           example:
 *             slug: "mango-orchard-2025"
 *             title: "Mango Orchard - 4mo"
 *             description: "Short description of the project"
 *             minInvestment: 10000
 *             roi4moPercent: 12
 *             roi12moPercent: 35
 *             durationMonths: 4
 *     responses:
 *       201:
 *         description: Project created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 */

/**
 * @openapi
 * /api/projects/{id}:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Get a project by id
 *     description: Returns a single project by MongoDB ObjectId.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: MongoDB ObjectId of the project
 *         required: true
 *         schema:
 *           type: string
 *           example: 64b2f0e0b4c3a1d2e3f45670
 *     responses:
 *       200:
 *         description: Project object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid id
 *       404:
 *         description: Not found
 */

/**
 * @openapi
 * /api/projects/{id}:
 *   put:
 *     tags:
 *       - Projects
 *     summary: Update a project (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: MongoDB ObjectId of the project
 *         required: true
 *         schema:
 *           type: string
 *           example: 64b2f0e0b4c3a1d2e3f45670
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Fields to update on the project.
 *             properties:
 *               slug:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               minInvestment:
 *                 type: number
 *               roi4moPercent:
 *                 type: number
 *               roi12moPercent:
 *                 type: number
 *               durationMonths:
 *                 type: number
 *           example:
 *             title: "Updated Mango Orchard"
 *             minInvestment: 15000
 *     responses:
 *       200:
 *         description: Updated project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid id / validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       404:
 *         description: Not found
 */

/**
 * @openapi
 * /api/projects/{id}:
 *   delete:
 *     tags:
 *       - Projects
 *     summary: Delete a project (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: MongoDB ObjectId of the project
 *         required: true
 *         schema:
 *           type: string
 *           example: 64b2f0e0b4c3a1d2e3f45670
 *     responses:
 *       204:
 *         description: Project deleted (no content)
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       404:
 *         description: Not found
 */

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ensureAuthenticated, role('admin'), ctrl.create);
router.put('/:id', ensureAuthenticated, role('admin'), ctrl.update);
router.delete('/:id', ensureAuthenticated, role('admin'), ctrl.remove);

module.exports = router;
