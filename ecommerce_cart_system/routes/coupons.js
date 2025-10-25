const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const auth = require('../middleware/auth');

// Create coupon
router.post('/', async (req, res) => {
  try {
    const { code, discountType, discountValue, expiresAt, minOrderValue } = req.body;
    const c = new Coupon({ code, discountType, discountValue, expiresAt, minOrderValue });
    await c.save();
    res.json(c);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// Validate coupon
router.post('/validate', auth, async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const coupon = await Coupon.findOne({ code });
    if (!coupon) return res.status(404).json({ msg: 'Coupon not found' });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ msg: 'Coupon expired' });
    if (cartTotal < coupon.minOrderValue) return res.status(400).json({ msg: 'Minimum order value not met' });
    let discount = 0;
    if (coupon.discountType === 'percent') discount = (coupon.discountValue / 100) * cartTotal;
    else discount = coupon.discountValue;
    res.json({ valid: true, discount: Math.min(discount, cartTotal) });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

module.exports = router;
