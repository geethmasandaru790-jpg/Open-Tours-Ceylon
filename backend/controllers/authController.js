// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isAccountVerified: user.isAccountVerified,
    isMasterAdmin: user.isMasterAdmin,
    status: user.status,
  };
}

exports.register = async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name, email, phone, passwordHash,
    role: ['tourist', 'driver', 'guide'].includes(role) ? role : 'tourist',
  });

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.status === 'suspended') return res.status(403).json({ error: 'Account suspended' });

  res.json({ token: signToken(user), user: publicUser(user) });
};

exports.me = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

exports.publicUser = publicUser;
