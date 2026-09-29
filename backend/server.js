require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const otpRoutes = require('./routes/otp');
const adsRoutes = require('./routes/ads');
const driversRoutes = require('./routes/drivers');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/admin', adminRoutes);

// Central error handler — keeps stack traces out of API responses.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

// backend/server.js

// ... your middleware, routes, DB connection, etc.

// Only listen locally — Vercel imports `app` directly
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
const path = require('path');

// Frontend ස්ටැටික් ෆයිල්ස් සර්ව් කිරීම සඳහා (.. මඟින් backend ෆෝල්ඩර් එකෙන් එළියට / root එකට යයි)
app.use(express.static(path.join(__dirname, '../frontend')));

// වෙනත් API රූට්ස් වලට අයිති නැති ඕනෑම රූට් එකක් සඳහා frontend/index.html එක පෙන්වීම
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});
module.exports = app;