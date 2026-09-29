const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function generateOtpCode() {
  const length = parseInt(process.env.OTP_LENGTH, 10) || 6;
  const max = 10 ** length;
  const code = crypto.randomInt(0, max).toString().padStart(length, '0');
  return code;
}

async function hashOtp(code) {
  return bcrypt.hash(code, 10);
}

async function verifyOtp(code, hash) {
  if (!hash) return false;
  return bcrypt.compare(code, hash);
}

function otpExpiry() {
  const minutes = parseInt(process.env.OTP_TTL_MINUTES, 10) || 10;
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Sends the OTP via the configured provider. In dev (no provider keys set)
 * it logs the code to the server console instead of actually sending it —
 * that fallback must never run in production.
 */
async function deliverOtp({ channel, destination, code }) {
  const hasProvider =
    (channel === 'email' && process.env.EMAIL_PROVIDER_API_KEY) ||
    (channel === 'phone' && process.env.SMS_PROVIDER_API_KEY);

  if (!hasProvider) {
    console.log(`[otp:dev-mode] ${channel} OTP for ${destination}: ${code}`);
    return { delivered: false, devMode: true };
  }

  // TODO: wire up a real provider, e.g.:
  //   email -> SendGrid/Resend/Postmark REST call using EMAIL_PROVIDER_API_KEY
  //   phone -> Twilio Verify / SMS API call using SMS_PROVIDER_API_KEY
  // Left unimplemented here since it depends on which provider you choose.
  throw new Error(`No OTP provider integration implemented for channel "${channel}" yet.`);
}

module.exports = { generateOtpCode, hashOtp, verifyOtp, otpExpiry, deliverOtp };
