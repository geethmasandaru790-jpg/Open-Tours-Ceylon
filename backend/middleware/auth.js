const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Verifies the Bearer JWT, loads the current user from the DB (so we always
 * check live status/role/verification, never trust stale claims in the
 * token), and attaches it as req.user.
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'User no longer exists.' });
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'This account has been suspended.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/** Optional auth: attaches req.user if a valid token is present, otherwise continues anonymously. */
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next();
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (user && user.status !== 'suspended') req.user = user;
  } catch (_) {
    // ignore invalid token for optional auth
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
