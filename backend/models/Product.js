const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    price: { type: Number, required: true, min: 0 },
    supplier: { type: String, required: true, trim: true },
    lowStockThreshold: { type: Number, default: 10 },
    sku: { type: String, unique: true, sparse: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

// Virtual for stock status
productSchema.virtual('stockStatus').get(function () {
  if (this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
