const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [] });
    await cart.save();
  }
  return cart;
}

// POST /cart  -- add or update a product in cart
router.post('/', auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity) return res.status(400).json({ msg: 'productId and quantity required' });
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    const cart = await getOrCreateCart(req.user._id);
    const idx = cart.items.findIndex(i => i.productId.toString() === productId);
    if (idx > -1) {
      cart.items[idx].quantity = cart.items[idx].quantity + Number(quantity);
    } else {
      cart.items.push({ productId, quantity: Number(quantity) });
    }
    cart.updatedAt = Date.now();
    await cart.save();
    res.json(cart);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// GET /cart -- retrieve cart
router.get('/', auth, async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    await cart.populate('items.productId');
    const transformed = {
      userId: cart.userId,
      items: cart.items.map(it => ({
        itemId: it._id,
        productId: it.productId._id,
        name: it.productId.name,
        price: it.productId.price,
        quantity: it.quantity,
        stock: it.productId.stock
      }))
    };
    transformed.totalAmount = transformed.items.reduce((s, i) => s + i.price * i.quantity, 0);
    res.json(transformed);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// PUT /cart -- update item quantity
router.put('/', auth, async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    if (!itemId || typeof quantity === 'undefined') return res.status(400).json({ msg: 'itemId and quantity required' });
    const cart = await getOrCreateCart(req.user._id);
    const idx = cart.items.findIndex(i => i._id.toString() === itemId);
    if (idx === -1) return res.status(404).json({ msg: 'Item not found in cart' });
    if (quantity <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = Number(quantity);
    }
    cart.updatedAt = Date.now();
    await cart.save();
    res.json(cart);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// DELETE /cart/:itemId
router.delete('/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await getOrCreateCart(req.user._id);
    cart.items = cart.items.filter(i => i._id.toString() !== itemId);
    cart.updatedAt = Date.now();
    await cart.save();
    res.json(cart);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

module.exports = router;
