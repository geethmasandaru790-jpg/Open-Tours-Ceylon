// backend/routes/adRoutes.js
const router = require('express').Router();
const auth = require('../middleware/auth');
const verifiedOnly = require('../middleware/verifiedOnly');
const ctrl = require('../controllers/adController');

router.get('/', ctrl.publicApprovedAds);
router.get('/mine', auth, ctrl.myAds);
router.post('/', auth, verifiedOnly, ctrl.createAd);
router.put('/:id', auth, verifiedOnly, ctrl.updateMyAd);
router.delete('/:id', auth, ctrl.deleteMyAd);

module.exports = router;
