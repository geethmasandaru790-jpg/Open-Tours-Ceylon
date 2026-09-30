// backend/routes/otpRoutes.js
const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/otpController');

const otpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 8 });

router.post('/send', auth, otpLimiter, ctrl.sendOtp);
router.post('/verify', auth, otpLimiter, ctrl.verifyOtp);

module.exports = router;
