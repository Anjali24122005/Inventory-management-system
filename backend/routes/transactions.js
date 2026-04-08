const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// GET /api/transactions?productId=xxx
router.get('/', protect, async (req, res, next) => {
  try {
    const { productId, page = 1, limit = 20 } = req.query;
    const query = productId ? { product: productId } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);
    res.json({ transactions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions/sale
router.post('/sale', protect, async (req, res, next) => {
  try {
    const { productId, saleType, quantitySold, saleDetails, handledBy, remarks } = req.body;

    if (!productId || !saleType || !quantitySold || !handledBy)
      return res.status(400).json({ message: 'productId, saleType, quantitySold, handledBy are required' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (quantitySold > product.quantity)
      return res.status(400).json({ message: `Cannot sell ${quantitySold}. Only ${product.quantity} in stock.` });

    const quantityBefore = product.quantity;
    product.quantity -= Number(quantitySold);
    await product.save();

    const txn = await Transaction.create({
      product: product._id,
      productName: product.name,
      type: 'sale',
      quantityChange: -Number(quantitySold),
      quantityBefore,
      quantityAfter: product.quantity,
      handledBy,
      userId: req.user._id,
      saleType,
      saleDetails,
      remarks,
    });

    res.status(201).json({ transaction: txn, product });
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions/restock
router.post('/restock', protect, async (req, res, next) => {
  try {
    const { productId, quantityAdded, restockDetails, handledBy, remarks } = req.body;

    if (!productId || !quantityAdded || !handledBy)
      return res.status(400).json({ message: 'productId, quantityAdded, handledBy are required' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const quantityBefore = product.quantity;
    product.quantity += Number(quantityAdded);
    await product.save();

    const txn = await Transaction.create({
      product: product._id,
      productName: product.name,
      type: 'restock',
      quantityChange: Number(quantityAdded),
      quantityBefore,
      quantityAfter: product.quantity,
      handledBy,
      userId: req.user._id,
      restockDetails,
      remarks,
    });

    res.status(201).json({ transaction: txn, product });
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/export/:productId
router.get('/export/:productId', protect, async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ product: req.params.productId }).sort({ createdAt: -1 }).lean();

    const fields = ['transactionId', 'type', 'quantityChange', 'quantityBefore', 'quantityAfter', 'handledBy', 'saleType', 'remarks', 'createdAt'];
    const csv = [
      fields.join(','),
      ...transactions.map((t) => fields.map((f) => `"${t[f] ?? ''}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-${req.params.productId}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
