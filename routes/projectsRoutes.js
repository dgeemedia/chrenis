// File: routes/projectsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/projectsController');
const { ensureAuthenticated } = require('../middlewares/auth');
const role = require('../middlewares/role');

/**
 * @openapi
 * /api/projects:
 *   post:
 *     tags:
 *       - Projects
 *     summary: "Create a project (admin only)"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slug
 *               - title
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

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ensureAuthenticated, role('admin'), ctrl.create);
router.put('/:id', ensureAuthenticated, role('admin'), ctrl.update);
router.delete('/:id', ensureAuthenticated, role('admin'), ctrl.remove);

module.exports = router;
