// middlewares/auth.js
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const verifyJwtFromHeader = (req) => {
  const auth = req.get('Authorization') || req.get('authorization') || '';
  if (!auth) return null;
  const parts = auth.split(' ');
  // Support both "Bearer <token>" and raw token
  const token = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : (parts.length === 1 ? parts[0] : null);
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

const ensureAuthenticated = (req, res, next) => {
  // session-based (passport)
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // Bearer JWT
  const payload = verifyJwtFromHeader(req);
  if (payload && payload.sub) {
    // map payload into req.user; convert sub to ObjectId when possible
    const user = { _id: payload.sub, email: payload.email, role: payload.role };
    if (typeof payload.sub === 'string' && ObjectId.isValid(payload.sub)) {
      try { user._id = new ObjectId(payload.sub); } catch (e) { /* leave as string */ }
    }
    req.user = user;
    return next();
  }

  // helpful debug hint (only in dev)
  if (process.env.NODE_ENV !== 'production') {
    console.warn('ensureAuthenticated failed: Authorization header present?', !!req.get('Authorization'));
  }

  return res.status(401).json({ error: 'Unauthorized', message: 'Valid session or Bearer JWT required' });
};

module.exports = { ensureAuthenticated, verifyJwtFromHeader };
