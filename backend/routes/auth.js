const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
router.use(authLimiter);

/**
 * POST /api/auth/register
 * role is restricted to tourist | driver | guide — "admin" can never be
 * self-assigned here. Admin status is derived elsewhere from PRIMARY_ADMIN_EMAIL.
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'name, email, phone and password are required.' });
    }
    const allowedRoles = ['tourist', 'driver', 'guide'];
    const safeRole = allowedRoles.includes(role) ? role : 'tourist';

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: safeRole,
      status: 'pending',
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'This account has been suspended.' });

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

function publicUser(user) {
  const adminEmail = (process.env.PRIMARY_ADMIN_EMAIL || '').toLowerCase();
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    isAccountVerified: user.isAccountVerified,
    status: user.status,
    isMasterAdmin: user.email.toLowerCase() === adminEmail,
  };
}

module.exports = router;
