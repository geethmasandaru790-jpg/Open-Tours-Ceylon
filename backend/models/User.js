const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, required: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },

    // 'admin' is NEVER set from client input — see routes/auth.js registration
    // handler, which forces role to 'tourist' | 'driver' | 'guide' only.
    // Admin status is derived at request time from PRIMARY_ADMIN_EMAIL, not stored as a role a user can request.
    role: {
      type: String,
      enum: ['tourist', 'driver', 'guide', 'admin'],
      default: 'tourist',
      required: true,
    },

    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    // Derived convenience flag, kept in sync whenever either verification flips true.
    isAccountVerified: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'pending',
    },

    otp: {
      codeHash: { type: String, select: false },
      channel: { type: String, enum: ['email', 'phone'] },
      expiresAt: { type: Date },
      attempts: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.methods.isPrimaryAdmin = function isPrimaryAdmin() {
  const adminEmail = (process.env.PRIMARY_ADMIN_EMAIL || '').toLowerCase();
  return !!adminEmail && this.email.toLowerCase() === adminEmail;
};

module.exports = mongoose.model('User', UserSchema);
