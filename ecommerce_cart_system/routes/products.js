const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Create product
router.post('/', async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    const p = new Product({ name, description, price, stock });
    await p.save();
    res.json(p);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// List products
router.get('/', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Get single product
router.get('/:id', async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ msg: 'Product not found' });
  res.json(p);
});

module.exports = router;
