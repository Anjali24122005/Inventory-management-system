import React, { useState, useEffect } from 'react';

const CATEGORIES = ['Electronics', 'Furniture', 'Stationery', 'Clothing', 'Food', 'Tools', 'Other'];

export default function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', category: '', quantity: '', price: '',
    supplier: '', sku: '', description: '', lowStockThreshold: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmQty, setConfirmQty] = useState(false); // initial qty confirmation

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '', category: product.category || '',
        quantity: product.quantity ?? '', price: product.price ?? '',
        supplier: product.supplier || '', sku: product.sku || '',
        description: product.description || '', lowStockThreshold: product.lowStockThreshold ?? 10,
      });
    }
  }, [product]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // For new products, show confirmation before saving
    if (!product && !confirmQty) {
      setConfirmQty(true);
      return;
    }

    setLoading(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
      setConfirmQty(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Initial Quantity Confirmation Screen */}
        {confirmQty ? (
          <div className="p-6 space-y-4 text-center">
            <div className="text-5xl">📦</div>
            <h3 className="text-lg font-bold">Confirm Initial Stock</h3>
            <p className="text-gray-500 text-sm">
              You are setting the initial quantity for <span className="font-semibold text-gray-800 dark:text-gray-200">{form.name}</span> to{' '}
              <span className="font-bold text-blue-600 text-lg">{form.quantity} units</span>.
            </p>
            <p className="text-xs text-gray-400">This will be recorded as the initial stock entry. Are you sure?</p>
            {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmQty(false)} className="btn-secondary flex-1">← Go Back</button>
              <button onClick={handleSubmit} className="btn-primary flex-1" disabled={loading}>
                {loading ? 'Saving...' : '✅ Yes, Confirm'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input className="input-field" value={form.name} onChange={set('name')} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select className="input-field" value={form.category} onChange={set('category')} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input className="input-field" value={form.sku} onChange={set('sku')} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {product ? 'Quantity (read-only)' : 'Initial Quantity *'}
                </label>
                <input
                  type="number" min="0" className="input-field"
                  value={form.quantity} onChange={set('quantity')}
                  required
                  // Lock quantity editing for existing products
                  readOnly={!!product}
                  title={product ? 'Use Sale or Restock to change quantity' : ''}
                  style={product ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                />
                {product && (
                  <p className="text-xs text-gray-400 mt-1">Use Sale / Restock buttons to change quantity</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                <input type="number" min="0" step="0.01" className="input-field" value={form.price} onChange={set('price')} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Supplier *</label>
                <input className="input-field" value={form.supplier} onChange={set('supplier')} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Low Stock Threshold</label>
                <input type="number" min="0" className="input-field" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="input-field" rows={2} value={form.description} onChange={set('description')} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={loading}>
                {loading ? 'Saving...' : product ? 'Update' : 'Next →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
