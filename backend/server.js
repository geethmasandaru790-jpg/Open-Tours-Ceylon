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

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] Open Tours Ceylon API listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('[server] Failed to connect to database:', err.message);
    process.exit(1);
  });
