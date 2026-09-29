const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { generateOtpCode, hashOtp, verifyOtp, otpExpiry, deliverOtp } = require('../utils/otp');

const router = express.Router();

const otpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 8 });
router.use(otpLimiter);

/**
 * POST /api/otp/send  { channel: 'email' | 'phone' }
 * Generates a fresh OTP, stores only its bcrypt hash, and (in production)
 * sends it via the configured provider.
 */
router.post('/send', requireAuth, async (req, res, next) => {
  try {
    const { channel } = req.body;
    if (!['email', 'phone'].includes(channel)) {
      return res.status(400).json({ error: 'channel must be "email" or "phone".' });
    }

    const code = generateOtpCode();
    const codeHash = await hashOtp(code);

    req.user.otp = { codeHash, channel, expiresAt: otpExpiry(), attempts: 0 };
    await req.user.save();

    const destination = channel === 'email' ? req.user.email : req.user.phone;
    const result = await deliverOtp({ channel, destination, code });

    res.json({
      message: `OTP sent via ${channel}.`,
      devMode: result.devMode || false, // frontend can surface a "check server console" hint in dev
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/otp/verify  { code }
 * Verifies against the currently stored OTP for whichever channel was last sent.
 * Flips isEmailVerified / isPhoneVerified, and isAccountVerified once at
 * least one channel is confirmed (adjust to "both required" if you want
 * stricter verification).
 */
router.post('/verify', requireAuth, async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code is required.' });

    const user = req.user;
    if (!user.otp || !user.otp.codeHash || !user.otp.expiresAt) {
      return res.status(400).json({ error: 'No OTP has been requested. Call /api/otp/send first.' });
    }
    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ error: 'This OTP has expired. Please request a new one.' });
    }
    if (user.otp.attempts >= 5) {
      return res.status(429).json({ error: 'Too many attempts. Please request a new OTP.' });
    }

    const match = await verifyOtp(code, user.otp.codeHash);
    if (!match) {
      user.otp.attempts += 1;
      await user.save();
      return res.status(400).json({ error: 'Incorrect code.' });
    }

    if (user.otp.channel === 'email') user.isEmailVerified = true;
    if (user.otp.channel === 'phone') user.isPhoneVerified = true;

    // Require at least one verified channel to unlock ad posting.
    // Tighten to `isEmailVerified && isPhoneVerified` for a stricter policy.
    user.isAccountVerified = user.isEmailVerified || user.isPhoneVerified;
    if (user.isAccountVerified && user.status === 'pending') user.status = 'active';

    user.otp = undefined;
    await user.save();

    res.json({
      message: 'Verified successfully.',
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      isAccountVerified: user.isAccountVerified,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
