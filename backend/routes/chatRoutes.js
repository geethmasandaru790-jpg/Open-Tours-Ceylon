// backend/routes/chatRoutes.js
const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ctrl = require('../controllers/chatController');

const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

// Chat is usable by anonymous visitors; attach req.user only if a valid token is present.
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.sub);
  } catch (_) { /* ignore invalid token for anonymous chat */ }
  next();
}

router.post('/', chatLimiter, optionalAuth, ctrl.chat);

module.exports = router;
