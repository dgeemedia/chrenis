const express = require('express');
const passport = require('passport');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

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
