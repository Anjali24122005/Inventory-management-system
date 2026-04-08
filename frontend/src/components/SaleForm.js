import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const today = () => new Date().toISOString().split('T')[0];

const INIT = {
  saleType: '',
  quantitySold: '',
  handledBy: '',
  remarks: '',
  // offline
  customerName: '', phone: '', address: '', purchaseDate: today(),
  // amazon/flipkart
  platform: '', quantityDispatched: '', orderBatchId: '',
  deliveryPersonName: '', deliveryPhone: '', logisticsPartner: '', dispatchDate: today(),
  // website
  orderId: '', contact: '', orderDate: today(),
};

export default function SaleForm({ product, onClose, onSubmit }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ ...INIT, handledBy: user?.name || '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const qty = Number(form.quantitySold || form.quantityDispatched);
    if (!qty || qty <= 0) return setError('Quantity must be greater than 0');
    if (qty > product.quantity) return setError(`Only ${product.quantity} units available`);

    setLoading(true);
    try {
      let saleDetails = {};
      if (form.saleType === 'offline') {
        saleDetails = {
          customerName: form.customerName, phone: form.phone,
          address: form.address, purchaseDate: form.purchaseDate,
        };
      } else if (form.saleType === 'amazon' || form.saleType === 'flipkart') {
        saleDetails = {
          platform: form.saleType, orderBatchId: form.orderBatchId,
          deliveryPersonName: form.deliveryPersonName, deliveryPhone: form.deliveryPhone,
          logisticsPartner: form.logisticsPartner, dispatchDate: form.dispatchDate,
        };
      } else if (form.saleType === 'website') {
        saleDetails = {
          customerName: form.customerName, orderId: form.orderId,
          contact: form.contact, orderDate: form.orderDate,
        };
      }

      await onSubmit({
        saleType: form.saleType,
        quantitySold: qty,
        handledBy: form.handledBy,
        remarks: form.remarks,
        saleDetails,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold">Record Sale</h2>
            <p className="text-sm text-gray-500">{product.name} — {product.quantity} in stock</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

          {product.quantity <= product.lowStockThreshold && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 text-sm p-3 rounded-lg">
              ⚠️ Warning: Stock is already low ({product.quantity} units remaining)
            </div>
          )}

          {/* Sale Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Sale Type *</label>
            <select className="input-field" value={form.saleType} onChange={set('saleType')} required>
              <option value="">Select sale type</option>
              <option value="offline">Offline Store</option>
              <option value="amazon">Amazon</option>
              <option value="flipkart">Flipkart</option>
              <option value="website">Website</option>
            </select>
          </div>

          {/* OFFLINE STORE */}
          {form.saleType === 'offline' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Customer Name *</label>
                  <input className="input-field" value={form.customerName} onChange={set('customerName')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number *</label>
                  <input className="input-field" value={form.phone} onChange={set('phone')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity Sold *</label>
                  <input type="number" min="1" max={product.quantity} className="input-field" value={form.quantitySold} onChange={set('quantitySold')} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Address *</label>
                  <input className="input-field" value={form.address} onChange={set('address')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Purchase *</label>
                  <input type="date" className="input-field" value={form.purchaseDate} onChange={set('purchaseDate')} required />
                </div>
              </div>
            </>
          )}

          {/* AMAZON / FLIPKART */}
          {(form.saleType === 'amazon' || form.saleType === 'flipkart') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity Dispatched *</label>
                  <input type="number" min="1" max={product.quantity} className="input-field" value={form.quantitySold} onChange={set('quantitySold')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Order / Batch ID *</label>
                  <input className="input-field" value={form.orderBatchId} onChange={set('orderBatchId')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Delivery Person Name *</label>
                  <input className="input-field" value={form.deliveryPersonName} onChange={set('deliveryPersonName')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Delivery Phone *</label>
                  <input className="input-field" value={form.deliveryPhone} onChange={set('deliveryPhone')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Logistics Partner</label>
                  <input className="input-field" placeholder="e.g. Delhivery, Ekart" value={form.logisticsPartner} onChange={set('logisticsPartner')} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dispatch Date *</label>
                  <input type="date" className="input-field" value={form.dispatchDate} onChange={set('dispatchDate')} required />
                </div>
              </div>
            </>
          )}

          {/* WEBSITE */}
          {form.saleType === 'website' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Customer Name *</label>
                  <input className="input-field" value={form.customerName} onChange={set('customerName')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Order ID *</label>
                  <input className="input-field" value={form.orderId} onChange={set('orderId')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact *</label>
                  <input className="input-field" value={form.contact} onChange={set('contact')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity Sold *</label>
                  <input type="number" min="1" max={product.quantity} className="input-field" value={form.quantitySold} onChange={set('quantitySold')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Order Date *</label>
                  <input type="date" className="input-field" value={form.orderDate} onChange={set('orderDate')} required />
                </div>
              </div>
            </>
          )}

          {/* Common fields */}
          {form.saleType && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Handled By *</label>
                <input className="input-field" value={form.handledBy} onChange={set('handledBy')} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <textarea className="input-field" rows={2} value={form.remarks} onChange={set('remarks')} placeholder="Optional notes..." />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-danger flex-1" disabled={loading || !form.saleType}>
              {loading ? 'Recording...' : '📤 Record Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
