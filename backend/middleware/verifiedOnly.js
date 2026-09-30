// backend/middleware/verifiedOnly.js
function verifiedOnly(req, res, next) {
  if (!req.user.isAccountVerified) {
    return res.status(403).json({
      error: 'Please verify your email or phone number first to create listings.',
      code: 'ACCOUNT_NOT_VERIFIED',
    });
  }
  next();
}

module.exports = verifiedOnly;
