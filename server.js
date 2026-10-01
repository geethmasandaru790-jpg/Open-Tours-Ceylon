/**
 * Open Tours Ceylon — Backend Server
 * Real Gmail SMTP OTP Authentication with Express and Nodemailer
 */
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets from current directory
app.use(express.static(path.join(__dirname)));

// In-Memory OTP Store: email -> { code, expiresAt, attempts, purpose, createdAt }
const otpStore = new Map();

// Periodic cleanup of expired OTPs every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(email);
    }
  }
}, 2 * 60 * 1000);

/**
 * Creates Nodemailer Transporter for Gmail SMTP
 */
function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: user,
      pass: pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Generate a beautifully styled HTML email template for the OTP
 */
function generateOtpHtml(otpCode, purpose = 'Verification', targetEmail) {
  const titleMap = {
    signup: 'Verify Your Tourist Account',
    login: 'Two-Factor Authentication Sign-In',
    reset: 'Password Recovery Code',
    google: 'Google Account 2-Step Verification',
    facebook: 'Facebook Account Verification'
  };
  const title = titleMap[purpose] || 'Verification Code';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Open Tours Ceylon - Verification Code</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b1120; padding: 40px 15px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 520px; background-color: #0f172a; border: 1px solid #334155; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
            <!-- Header -->
            <tr>
              <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #1e293b; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);">
                <div style="display: inline-block; padding: 10px 14px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 12px; margin-bottom: 14px;">
                  <span style="font-size: 20px; font-weight: 800; color: #f59e0b; letter-spacing: -0.5px;">🦁 Open Tours Ceylon</span>
                </div>
                <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">${title}</h1>
                <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8;">Discover Sri Lanka with Verified Driver-Guides</p>
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td style="padding: 32px;">
                <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #cbd5e1;">
                  Hello,
                </p>
                <p style="margin: 0 0 24px; font-size: 14px; line-height: 22px; color: #cbd5e1;">
                  We received an authentication request for <strong style="color: #f59e0b;">${targetEmail}</strong>. Use the verification code below to complete your authentication:
                </p>

                <!-- OTP Code Display Card -->
                <div style="background-color: #1e293b; border: 2px dashed #f59e0b; border-radius: 14px; padding: 22px 16px; text-align: center; margin: 24px 0;">
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-bottom: 8px;">Your One-Time Code</div>
                  <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #f59e0b; text-indent: 10px;">
                    ${otpCode}
                  </div>
                  <div style="font-size: 12px; color: #e2e8f0; margin-top: 8px;">⏱️ Valid for <strong>10 minutes</strong></div>
                </div>

                <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 12px 14px; border-radius: 6px; margin: 24px 0 0;">
                  <p style="margin: 0; font-size: 12px; line-height: 18px; color: #fca5a5;">
                    <strong>Security Warning:</strong> Never share this code with anyone, including Open Tours Ceylon staff. If you did not initiate this request, you can safely ignore this email.
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 32px; background-color: #0b1120; border-top: 1px solid #1e293b; text-align: center;">
                <p style="margin: 0; font-size: 11px; color: #64748b;">
                  Open Tours Ceylon &bull; Tourism Driver-Guide Network, Sri Lanka<br>
                  WhatsApp: +94 71 306 1980 &bull; Secure Authentication Portal
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * POST /api/send-otp
 * Generates a real 6-digit OTP and dispatches it to the user's Gmail address via SMTP.
 */
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email address format.' });
    }

    // Generate secure 6-digit cryptographic OTP
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store in-memory
    otpStore.set(cleanEmail, {
      code: otpCode,
      expiresAt,
      attempts: 0,
      purpose: purpose || 'verification',
      createdAt: Date.now()
    });

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    // Check if real SMTP credentials are provided
    const isConfigured = user && pass && !user.includes('your-email') && !pass.includes('your-');

    if (!isConfigured) {
      console.warn(`[SMTP Warning] Real Gmail credentials not configured in .env (EMAIL_USER: ${user || 'unset'}). OTP stored in memory for testing.`);
      // Return success with note if credentials are not configured yet
      return res.json({
        success: true,
        message: `Verification code generated for ${cleanEmail}. (Configure EMAIL_USER and EMAIL_PASS in .env for live Gmail SMTP delivery).`,
        emailSent: false,
        smtpConfigured: false
      });
    }

    const transporter = getTransporter();

    const subjectMap = {
      signup: 'Your Open Tours Ceylon Account Verification Code',
      login: 'Your Open Tours Ceylon Sign-In Security Code',
      reset: 'Your Open Tours Ceylon Password Reset Code',
      google: 'Your Google Sign-In Verification Code',
      facebook: 'Your Facebook Sign-In Verification Code'
    };
    const subject = subjectMap[purpose] || 'Your Open Tours Ceylon Verification Code';

    const mailOptions = {
      from: `"Open Tours Ceylon" <${user}>`,
      to: cleanEmail,
      subject: `${subject}: ${otpCode}`,
      text: `Your Open Tours Ceylon verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.\nIf you did not request this code, please ignore this email.`,
      html: generateOtpHtml(otpCode, purpose, cleanEmail)
    };

    console.log(`[SMTP] Dispatching real Gmail OTP to: ${cleanEmail}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP Success] Email sent: ${info.messageId}`);

    return res.json({
      success: true,
      message: `A verification code was successfully sent to ${cleanEmail}. Please check your inbox.`,
      emailSent: true,
      smtpConfigured: true
    });
  } catch (error) {
    console.error('[SMTP Error] Failed to send email via Gmail SMTP:', error);

    // If SMTP fails, the OTP is still valid in memory so user can test or retry
    return res.status(500).json({
      success: false,
      message: `Failed to deliver email via Gmail SMTP: ${error.message || 'SMTP connection error'}. Please verify your Gmail App Password in .env.`
    });
  }
});

/**
 * POST /api/verify-otp
 * Validates the 6-digit code against the stored OTP for the email.
 */
app.post('/api/verify-otp', (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code).trim().replace(/^(G-|FB-)/i, '').replace(/\s+/g, '');

    const record = otpStore.get(cleanEmail);

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No active verification code found for this email. Please request a new code.'
      });
    }

    // Check expiration
    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    // Increment attempt counter to prevent brute-force attacks
    record.attempts += 1;
    if (record.attempts > 5) {
      otpStore.delete(cleanEmail);
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a fresh verification code.'
      });
    }

    // Strict code comparison
    if (record.code !== cleanCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check your Gmail and try again.'
      });
    }

    // Verification successful — delete OTP to prevent replay attacks
    otpStore.delete(cleanEmail);

    console.log(`[Auth Success] OTP verified successfully for: ${cleanEmail}`);
    return res.json({
      success: true,
      message: 'Verification successful.'
    });
  } catch (error) {
    console.error('[Verify Error]', error);
    return res.status(500).json({ success: false, message: 'Internal server error while verifying code.' });
  }
});

/**
 * GET /api/status
 * Diagnostic endpoint
 */
app.get('/api/status', (req, res) => {
  const user = process.env.EMAIL_USER;
  const isConfigured = !!(user && process.env.EMAIL_PASS && !user.includes('your-email'));
  res.json({
    status: 'online',
    smtpConfigured: isConfigured,
    senderEmail: isConfigured ? user : 'Not configured (check .env)',
    timestamp: new Date().toISOString()
  });
});

// Fallback route for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`Open Tours Ceylon Server running at:`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`Gmail SMTP Status: ${process.env.EMAIL_USER ? 'Configured (' + process.env.EMAIL_USER + ')' : 'Requires .env EMAIL_USER and EMAIL_PASS'}`);
  console.log(`=================================================`);
});
