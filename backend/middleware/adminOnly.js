// backend/middleware/adminOnly.js
function adminOnly(req, res, next) {
  if (!req.user.isMasterAdmin && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access only' });
  }
  next();
}

module.exports = adminOnly;
