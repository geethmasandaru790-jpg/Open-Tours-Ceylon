// backend/routes/adminRoutes.js
const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const ctrl = require('../controllers/adminController');

router.use(auth, adminOnly);
router.get('/stats', ctrl.stats);
router.get('/ads', ctrl.listAds);
router.patch('/ads/:id/approve', ctrl.approveAd);
router.patch('/ads/:id/reject', ctrl.rejectAd);
router.get('/users', ctrl.listUsers);
router.patch('/users/:id/suspend', ctrl.suspendUser);
router.patch('/users/:id/reactivate', ctrl.reactivateUser);

module.exports = router;
