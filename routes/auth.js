// File: routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const dbConn = require('../db/connect');
const bcrypt = require('bcrypt');

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: "Log in user (email/password) — returns JWT and sets session"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful — returns token and user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Missing email/password
 *       401:
 *         description: Invalid credentials
 */

const jwtSign = (user) => {
  if (!user) throw new Error('jwtSign requires a user object');
  const id = (user._id && typeof user._id.toString === 'function') ? user._id.toString() : (user.id || user._id || String(user));
  const payload = { sub: id, email: user.email || null, role: user.role || 'user' };
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set');
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const getSwaggerRedirectPage = () => {
  const local = process.env.SWAGGER_LOCAL || `http://localhost:${process.env.PORT || 8083}`;
  return `${local.replace(/\/+$/, '')}/api-docs/oauth2-redirect.html`;
};

/**
 * POST /auth/login
 * - Accepts form or JSON POST with { email, password }
 * - Verifies password, issues JWT, establishes Passport session.
 * - If request accepts JSON, returns { token, user }.
 * - Otherwise redirects to /user/dashboard (browser form flow).
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).format({
      json: () => res.json({ message: 'email and password required' }),
      html: () => res.redirect('/user/login')
    });

    // fetch user
    const db = dbConn.getDb();
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).format({
        json: () => res.json({ message: 'Invalid credentials' }),
        html: () => res.render('user/login', { title: 'Login', error: 'Invalid credentials' })
      });
    }

    // verify password
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).format({
        json: () => res.json({ message: 'Invalid credentials' }),
        html: () => res.render('user/login', { title: 'Login', error: 'Invalid credentials' })
      });
    }

    // create JWT using helper
    const token = jwtSign(user);

    // sanitize user object for session/response
    const safeUser = { ...user };
    delete safeUser.passwordHash;

    // establish passport session for browser flows
    req.login(safeUser, (err) => {
      if (err) {
        console.warn('req.login error:', err);
        // still return token for API clients
      }

      // Respond: JSON for API/XHR, redirect for browser form
      // Use req.xhr or Accept header to decide
      const wantsJson = req.xhr || (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1);

      if (wantsJson) {
        return res.json({ token, user: { _id: safeUser._id, email: safeUser.email, name: safeUser.name, role: safeUser.role } });
      } else {
        // For browser flows, set a one-time flash message optionally
        if (req.session) req.session.flash = { success: 'Logged in' };
        return res.redirect('/user/dashboard');
      }
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------
   OAuth GitHub handlers (unchanged)
   ------------------------ */

router.get('/start-oauth', (req, res, next) => {
  try {
    const state = crypto.randomBytes(32).toString('hex');
    req.session.oauthState = state;
    res.cookie('oauth_state', state, {
      maxAge: 5 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax'
    });

    req.session.save((err) => {
      if (err) return res.status(500).send('Error starting OAuth');
      passport.authenticate('github', { scope: ['user:email'], state })(req, res, next);
    });
  } catch (err) {
    next(err);
  }
});

router.get('/github', (req, res, next) => {
  try {
    let state = req.session && req.session.oauthState;
    if (!state) {
      state = crypto.randomBytes(32).toString('hex');
      req.session.oauthState = state;
      res.cookie('oauth_state', state, { maxAge: 5 * 60 * 1000, httpOnly: true, sameSite: 'lax' });
      req.session.save((err) => {
        if (err) return res.status(500).send('Error starting OAuth');
        passport.authenticate('github', { scope: ['user:email'], state })(req, res, next);
      });
    } else {
      res.cookie('oauth_state', state, { maxAge: 5 * 60 * 1000, httpOnly: true, sameSite: 'lax' });
      passport.authenticate('github', { scope: ['user:email'], state })(req, res, next);
    }
  } catch (err) {
    next(err);
  }
});

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/auth/github/failure', session: true }),
  (req, res) => {
    try {
      const returnedState = req.query && req.query.state;
      const storedState = req.session && req.session.oauthState;
      const cookieState = req.cookies && req.cookies.oauth_state;

      if (!returnedState || (storedState !== returnedState && cookieState !== returnedState)) {
        if (req.session) delete req.session.oauthState;
        res.clearCookie('oauth_state');
        const swaggerOauthPage = getSwaggerRedirectPage();
        return res.redirect(`${swaggerOauthPage}#error=state_mismatch`);
      }

      if (req.session) delete req.session.oauthState;
      res.clearCookie('oauth_state');

      const user = { ...req.user };
      delete user.passwordHash;
      const token = jwtSign(user);

      const swaggerOauthPage = getSwaggerRedirectPage();
      const fragParts = [
        `access_token=${encodeURIComponent(token)}`,
        `token_type=bearer`
      ];
      if (returnedState) fragParts.push(`state=${encodeURIComponent(returnedState)}`);
      const fragment = `#${fragParts.join('&')}`;

      return res.redirect(`${swaggerOauthPage}${fragment}`);
    } catch (err) {
      const swaggerOauthPage = getSwaggerRedirectPage();
      return res.redirect(`${swaggerOauthPage}#error=server_error`);
    }
  }
);

router.get('/github/failure', (req, res) => res.status(401).send('GitHub authentication failed.'));

router.post('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);
    req.session.destroy(() => {
      res.json({ message: 'Logged out' });
    });
  });
});

module.exports = router;
