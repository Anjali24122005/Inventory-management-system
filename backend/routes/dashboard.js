const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', protect, async (req, res, next) => {
  try {
    const allProducts = await Product.find({});

    const totalProducts = allProducts.length;
    const totalValue = allProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const outOfStock = allProducts.filter((p) => p.quantity === 0).length;
    const lowStock = allProducts.filter(
      (p) => p.quantity > 0 && p.quantity <= p.lowStockThreshold
    ).length;

    // Category breakdown
    const categoryMap = {};
    allProducts.forEach((p) => {
      categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
    });
    const categoryBreakdown = Object.entries(categoryMap).map(([name, count]) => ({
      name,
      count,
    }));

    // Monthly inventory value (last 6 months based on createdAt)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentActivity = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name');

    res.json({
      totalProducts,
      totalValue,
      outOfStock,
      lowStock,
      categoryBreakdown,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
