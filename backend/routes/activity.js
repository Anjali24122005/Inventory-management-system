const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');

// GET /api/activity
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Activity.countDocuments();
    res.json({ activities, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
