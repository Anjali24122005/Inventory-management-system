const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');

const logActivity = async (user, action, product, changes = {}) => {
  await Activity.create({
    user: user._id,
    userName: user.name,
    action,
    productId: product._id,
    productName: product.name,
    changes,
  });
};

// GET /api/products
router.get('/', protect, async (req, res, next) => {
  try {
    const { search, category, sortBy, order, page = 1, limit = 10, stockStatus } = req.query;

    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = { $regex: category, $options: 'i' };

    const sortObj = {};
    if (sortBy) sortObj[sortBy] = order === 'desc' ? -1 : 1;
    else sortObj.createdAt = -1;

    const skip = (Number(page) - 1) * Number(limit);
    let products = await Product.find(query).sort(sortObj).skip(skip).limit(Number(limit));

    // Filter by stock status after fetching (virtual field)
    if (stockStatus) {
      products = products.filter((p) => p.stockStatus === stockStatus);
    }

    const total = await Product.countDocuments(query);

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/export
router.get('/export', protect, async (req, res, next) => {
  try {
    const products = await Product.find({}).lean();
    const fields = ['name', 'category', 'quantity', 'price', 'supplier', 'sku', 'createdAt'];
    const csv = [
      fields.join(','),
      ...products.map((p) => fields.map((f) => `"${p[f] ?? ''}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

const productValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be >= 0'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be >= 0'),
  body('supplier').notEmpty().withMessage('Supplier is required'),
];

// POST /api/products
router.post('/', protect, productValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const product = await Product.create(req.body);
    await logActivity(req.user, 'created', product, req.body);

    // Log initial quantity as a transaction
    const Transaction = require('../models/Transaction');
    await Transaction.create({
      product: product._id,
      productName: product.name,
      type: 'initial',
      quantityChange: product.quantity,
      quantityBefore: 0,
      quantityAfter: product.quantity,
      handledBy: req.user.name,
      userId: req.user._id,
      remarks: 'Initial stock entry',
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id  (quantity changes are LOCKED — use /transactions/sale or /restock)
router.put('/:id', protect, productValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    // Block direct quantity changes
    if (req.body.quantity !== undefined && Number(req.body.quantity) !== existing.quantity) {
      return res.status(403).json({ message: 'Direct quantity editing is disabled. Use Sale or Restock.' });
    }

    // Track changes (non-quantity fields)
    const changes = {};
    ['name', 'category', 'price', 'supplier'].forEach((field) => {
      if (req.body[field] !== undefined && String(existing[field]) !== String(req.body[field])) {
        changes[field] = { from: existing[field], to: req.body[field] };
      }
    });

    // Keep existing quantity
    req.body.quantity = existing.quantity;

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await logActivity(req.user, 'updated', product, changes);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await logActivity(req.user, 'deleted', product);
    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
