/**
 * Role-based access control. Must run AFTER requireAuth so req.user exists.
 * Usage: router.post('/ads', requireAuth, requireRole('driver', 'guide'), handler)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

/**
 * Master Admin gate. Admin status is NEVER read from the client or from a
 * stored "role: admin" flag a user could have set on themselves — it is
 * derived, on every request, purely from whether the authenticated user's
 * email matches PRIMARY_ADMIN_EMAIL in the server's own environment config.
 */
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

  const adminEmail = (process.env.PRIMARY_ADMIN_EMAIL || '').toLowerCase();
  const isMasterAdmin = !!adminEmail && req.user.email.toLowerCase() === adminEmail;

  if (!isMasterAdmin) {
    return res.status(403).json({ error: 'Admin access only.' });
  }
  next();
}

/**
 * Blocks drivers/guides from posting or editing ads unless their account has
 * passed OTP verification. Unverified users get a distinct error code the
 * frontend uses to redirect straight to the OTP screen.
 */
function requireVerifiedAccount(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  if (!req.user.isAccountVerified) {
    return res.status(403).json({
      error: 'Your account is not verified yet.',
      code: 'ACCOUNT_NOT_VERIFIED',
    });
  }
  next();
}

/** Ensures a user can only touch resources they own, unless they're the master admin. */
function requireOwnerOrAdmin(getOwnerId) {
  return async (req, res, next) => {
    try {
      const ownerId = await getOwnerId(req);
      const adminEmail = (process.env.PRIMARY_ADMIN_EMAIL || '').toLowerCase();
      const isMasterAdmin = req.user && req.user.email.toLowerCase() === adminEmail;
      if (isMasterAdmin) return next();
      if (!ownerId || String(ownerId) !== String(req.user._id)) {
        return res.status(403).json({ error: 'You can only access your own resources.' });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireRole, requireAdmin, requireVerifiedAccount, requireOwnerOrAdmin };
