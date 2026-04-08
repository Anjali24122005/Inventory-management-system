const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted'],
      required: true,
    },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    changes: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
