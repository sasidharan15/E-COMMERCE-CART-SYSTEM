const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');

router.post('/', auth, async (req, res) => {
  try {
    const { couponCode } = req.body;
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
    if (!cart || cart.items.length === 0) return res.status(400).json({ msg: 'Cart is empty' });

    for (const it of cart.items) {
      if (it.productId.stock < it.quantity) {
        return res.status(400).json({ msg: `Insufficient stock for ${it.productId.name}` });
      }
    }

    let total = 0;
    const orderItems = cart.items.map(it => {
      const p = it.productId;
      const line = { productId: p._id, name: p.name, price: p.price, quantity: it.quantity };
      total += p.price * it.quantity;
      return line;
    });

    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode });
      if (!coupon) return res.status(400).json({ msg: 'Invalid coupon' });
      if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ msg: 'Coupon expired' });
      if (total < coupon.minOrderValue) return res.status(400).json({ msg: 'Minimum order value not met' });
      if (coupon.discountType === 'percent') discount = (coupon.discountValue / 100) * total;
      else discount = coupon.discountValue;
      discount = Math.min(discount, total);
      total = total - discount;
    }

    const paymentSuccess = true;
    if (!paymentSuccess) return res.status(400).json({ msg: 'Payment failed' });

    for (const it of cart.items) {
      await Product.findByIdAndUpdate(it.productId._id, { $inc: { stock: -it.quantity } });
    }

    const order = new Order({ userId: req.user._id, items: orderItems, totalAmount: total, status: 'confirmed' });
    await order.save();

    cart.items = [];
    await cart.save();

    res.json({ msg: 'Order placed', orderId: order._id, total, discount });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

module.exports = router;
