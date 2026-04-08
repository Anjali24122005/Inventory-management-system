import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const today = () => new Date().toISOString().split('T')[0];

export default function RestockForm({ product, onClose, onSubmit }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    quantityAdded: '',
    supplierName: product.supplier || '',
    supplierContact: '',
    purchaseDate: today(),
    invoiceNumber: '',
    handledBy: user?.name || '',
    remarks: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.quantityAdded || Number(form.quantityAdded) <= 0)
      return setError('Quantity must be greater than 0');

    setLoading(true);
    try {
      await onSubmit({
        quantityAdded: Number(form.quantityAdded),
        handledBy: form.handledBy,
        remarks: form.remarks,
        restockDetails: {
          supplierName: form.supplierName,
          supplierContact: form.supplierContact,
          purchaseDate: form.purchaseDate,
          invoiceNumber: form.invoiceNumber,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record restock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold">Restock Product</h2>
            <p className="text-sm text-gray-500">{product.name} — current stock: {product.quantity}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Quantity Added *</label>
              <input type="number" min="1" className="input-field" value={form.quantityAdded} onChange={set('quantityAdded')} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Purchase Date *</label>
              <input type="date" className="input-field" value={form.purchaseDate} onChange={set('purchaseDate')} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supplier Name *</label>
              <input className="input-field" value={form.supplierName} onChange={set('supplierName')} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supplier Contact</label>
              <input className="input-field" value={form.supplierContact} onChange={set('supplierContact')} placeholder="Phone / Email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Invoice Number</label>
              <input className="input-field" value={form.invoiceNumber} onChange={set('invoiceNumber')} placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Handled By *</label>
              <input className="input-field" value={form.handledBy} onChange={set('handledBy')} required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Remarks</label>
              <textarea className="input-field" rows={2} value={form.remarks} onChange={set('remarks')} placeholder="Optional notes..." />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Saving...' : '📦 Confirm Restock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
