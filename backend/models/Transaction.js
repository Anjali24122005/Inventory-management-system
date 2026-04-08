const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, default: () => 'TXN-' + uuidv4().slice(0, 8).toUpperCase(), unique: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    type: { type: String, enum: ['sale', 'restock', 'initial'], required: true },
    quantityChange: { type: Number, required: true }, // negative for sale, positive for restock
    quantityBefore: { type: Number, required: true },
    quantityAfter: { type: Number, required: true },

    // Who did it
    handledBy: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Sale-specific
    saleType: { type: String, enum: ['offline', 'amazon', 'flipkart', 'website', null], default: null },
    saleDetails: { type: Object, default: {} },

    // Restock-specific
    restockDetails: { type: Object, default: {} },

    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
