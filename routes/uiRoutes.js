// routes/uiRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db/connect');
const { ObjectId } = require('mongodb');

// Home (index)
router.get('/', async (req, res, next) => {
  try {
    const projects = await db.getDb().collection('projects').find({ status: 'active' }).limit(6).toArray();
    res.render('index', { title: 'Home', projects });
  } catch (err) { next(err); }
});

// Projects list
router.get('/projects', async (req, res, next) => {
  try {
    const projects = await db.getDb().collection('projects').find({ status: 'active' }).toArray();
    res.render('projects/index', { title: 'Projects', projects });
  } catch (err) { next(err); }
});

// Single project
router.get('/projects/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).send('Invalid id');
    const project = await db.getDb().collection('projects').findOne({ _id: new ObjectId(id) });
    if (!project) return res.status(404).render('404', { title: 'Not found' });
    res.render('projects/show', { title: project.title, project });
  } catch (err) { next(err); }
});

// Investments page
router.get('/investments', async (req, res, next) => {
  try {
    if (req.user) {
      // show user's investments
      const invs = await db.getDb().collection('investments').find({ userId: req.user._id }).toArray();
      // optionally populate projects quickly
      const projectIds = [...new Set(invs.filter(i => i.projectId).map(i => i.projectId.toString()))];
      const projects = projectIds.length ? await db.getDb().collection('projects').find({ _id: { $in: projectIds.map(id => new ObjectId(id)) } }).toArray() : [];
      const map = Object.fromEntries(projects.map(p => [p._id.toString(), p]));
      invs.forEach(i => { if (i.projectId) i.project = map[i.projectId.toString()]; });
      return res.render('investments/index', { title: 'My Investments', investments: invs });
    } else {
      // show CTA + available projects
      const projects = await db.getDb().collection('projects').find({ status: 'active' }).toArray();
      return res.render('investments/index', { title: 'Invest', projects });
    }
  } catch (err) { next(err); }
});

// Users list (admin-only)
router.get('/users', async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.redirect(req.user ? '/user/dashboard' : '/user/login');
    }
    const users = await db.getDb().collection('users').find().project({ passwordHash: 0 }).toArray();
    res.render('users/index', { title: 'Users', users });
  } catch (err) { next(err); }
});

/* -------------------------
   User pages: register/login/dashboard
   ------------------------- */

// GET register page
router.get('/user/register', (req, res) => {
  // render the registration page (form posts to /api/users)
  res.render('user/register', { title: 'Register' });
});

// GET login page
router.get('/user/login', (req, res) => {
  // render the login page (form posts to /auth/login)
  res.render('user/login', { title: 'Login' });
});

// GET user dashboard (must be authenticated via session)
router.get('/user/dashboard', async (req, res, next) => {
  try {
    if (!req.user) return res.redirect('/user/login');

    // fetch a couple of items for the dashboard
    const userId = req.user._id;
    const investments = await db.getDb().collection('investments').find({ userId: userId }).toArray();
    res.render('user/dashboard', { title: 'Dashboard', investments });
  } catch (err) { next(err); }
});

module.exports = router;
