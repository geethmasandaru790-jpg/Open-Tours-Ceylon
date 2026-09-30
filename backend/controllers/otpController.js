// backend/controllers/otpController.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const OtpToken = require('../models/OtpToken');
const User = require('../models/User');

// Wire real providers here (e.g. Nodemailer/SendGrid for email, Twilio for SMS).
// Until env vars are set, codes are only logged server-side (devMode).
async function sendEmailOtp(user, code) {
  if (!process.env.SMTP_HOST) { console.log(`[DEV OTP] Email code for ${user.email}: ${code}`); return false; }
  // TODO: integrate real email provider
  return true;
}
async function sendSmsOtp(user, code) {
  if (!process.env.TWILIO_SID) { console.log(`[DEV OTP] SMS code for ${user.phone}: ${code}`); return false; }
  // TODO: integrate real SMS provider (Twilio, etc.)
  return true;
}

exports.sendOtp = async (req, res) => {
  const { channel } = req.body;
  if (!['email', 'phone'].includes(channel)) return res.status(400).json({ error: 'Invalid channel' });

  const code = String(crypto.randomInt(100000, 999999));
  const codeHash = await bcrypt.hash(code, 10);
  await OtpToken.deleteMany({ userId: req.user._id, channel });
  await OtpToken.create({
    userId: req.user._id, channel, codeHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  const sentLive = channel === 'email' ? await sendEmailOtp(req.user, code) : await sendSmsOtp(req.user, code);
  res.json({ ok: true, devMode: !sentLive });
};

exports.verifyOtp = async (req, res) => {
  const { code } = req.body;
  const token = await OtpToken.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
  if (!token) return res.status(400).json({ error: 'No OTP requested' });
  if (token.expiresAt < new Date()) return res.status(400).json({ error: 'Code expired, request a new one' });
  if (token.attempts >= 5) return res.status(429).json({ error: 'Too many attempts, request a new code' });

  const ok = await bcrypt.compare(String(code || ''), token.codeHash);
  if (!ok) {
    token.attempts += 1;
    await token.save();
    return res.status(400).json({ error: 'Incorrect code' });
  }

  const update = token.channel === 'email' ? { isEmailVerified: true } : { isPhoneVerified: true };
  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
  if (user.isEmailVerified || user.isPhoneVerified) {
    user.isAccountVerified = true;
    user.status = 'active';
    await user.save();
  }
  await OtpToken.deleteMany({ userId: req.user._id });

  res.json({ ok: true });
};
