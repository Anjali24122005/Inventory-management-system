import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ProductModal from '../components/ProductModal';
import LowStockAlertModal from '../components/LowStockAlertModal';
import CriticalInventory from '../components/CriticalInventory';
import SaleForm from '../components/SaleForm';
import RestockForm from '../components/RestockForm';
import HistoryModal from '../components/HistoryModal';
import { useAlert } from '../context/AlertContext';

const STOCK_BADGE = {
  in_stock: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  low_stock: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  out_of_stock: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const STOCK_LABEL = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock' };
const isLowStock = (p) => p.stockStatus === 'low_stock' || p.stockStatus === 'out_of_stock';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [order, setOrder] = useState('asc');
  const [stockFilter, setStockFilter] = useState('');

  // Modals
  const [editModal, setEditModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [saleProduct, setSaleProduct] = useState(null);
  const [restockProduct, setRestockProduct] = useState(null);
  const [historyProduct, setHistoryProduct] = useState(null);

  const { lowStockProducts, refetch } = useAlert();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (category) params.category = category;
      if (sortBy) { params.sortBy = sortBy; params.order = order; }
      if (stockFilter) params.stockStatus = stockFilter;

      const { data } = await api.get('/products', { params });

      // Auto-sort: low stock floats to top
      const sorted = [...data.products].sort((a, b) => {
        const aLow = isLowStock(a) ? 0 : 1;
        const bLow = isLowStock(b) ? 0 : 1;
        return aLow - bLow;
      });

      setProducts(sorted);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, sortBy, order, stockFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const refresh = () => { fetchProducts(); refetch(); };

  const handleSave = async (form) => {
    if (editModal && editModal._id) {
      await api.put(`/products/${editModal._id}`, form);
      toast.success('Product updated');
    } else {
      await api.post('/products', form);
      toast.success('Product added');
    }
    setEditModal(null);
    refresh();
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${deleteId}`);
      toast.success('Product deleted');
      setDeleteId(null);
      refresh();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleSale = async (payload) => {
    await api.post('/transactions/sale', { productId: saleProduct._id, ...payload });
    toast.success('Sale recorded successfully');
    setSaleProduct(null);
    refresh();
  };

  const handleRestock = async (payload) => {
    await api.post('/transactions/restock', { productId: restockProduct._id, ...payload });
    toast.success('Restock recorded successfully');
    setRestockProduct(null);
    refresh();
  };

  const handleReorder = (product) => {
    setRestockProduct(product);
    setAlertModal(false);
  };

  const handleExport = async () => {
    const res = await api.get('/products/export', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url; a.download = 'inventory.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (field) => {
    if (sortBy === field) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setOrder('asc'); }
    setPage(1);
  };

  const SortIcon = ({ field }) => sortBy === field ? (order === 'asc' ? ' ↑' : ' ↓') : ' ↕';

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-2 flex-wrap">
          {lowStockProducts.length > 0 && (
            <button onClick={() => setAlertModal(true)} className="flex items-center gap-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 critical-pulse">
              ⚠️ {lowStockProducts.length} Critical
            </button>
          )}
          <button onClick={handleExport} className="btn-secondary text-sm">📥 Export CSV</button>
          <button onClick={() => setEditModal('add')} className="btn-primary text-sm">+ Add Product</button>
        </div>
      </div>

      {/* Critical Inventory */}
      <CriticalInventory onReorder={handleReorder} />

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <input className="input-field max-w-xs" placeholder="Search by name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <input className="input-field max-w-xs" placeholder="Filter by category..." value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} />
        <select className="input-field max-w-xs" value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}>
          <option value="">All Stock Status</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-blue-600" onClick={() => toggleSort('quantity')}>Qty<SortIcon field="quantity" /></th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-blue-600" onClick={() => toggleSort('price')}>Price<SortIcon field="price" /></th>
                <th className="text-left px-4 py-3 font-medium">Supplier</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No products found</td></tr>
              ) : (
                products.map((p) => {
                  const critical = isLowStock(p);
                  return (
                    <tr key={p._id} className={critical ? 'low-stock-row' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}>
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          {p.name}
                          {critical && <span className="text-xs font-bold text-red-600 dark:text-red-400 critical-badge">⚠ Critical</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.category}</td>
                      <td className={`px-4 py-3 font-medium ${critical ? 'text-red-600 dark:text-red-400' : ''}`}>{p.quantity}</td>
                      <td className="px-4 py-3">₹{Number(p.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.supplier}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STOCK_BADGE[p.stockStatus]}`}>
                          {STOCK_LABEL[p.stockStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          <button onClick={() => setSaleProduct(p)} className="text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-1 rounded font-medium border border-red-200 dark:border-red-800">📤 Sale</button>
                          <button onClick={() => setRestockProduct(p)} className="text-xs bg-green-50 hover:bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-1 rounded font-medium border border-green-200 dark:border-green-800">📦 Restock</button>
                          <button onClick={() => setHistoryProduct(p)} className="text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded font-medium border border-blue-200 dark:border-blue-800">🕐 History</button>
                          <button onClick={() => setEditModal(p)} className="text-xs text-gray-500 hover:text-gray-700 font-medium px-1">Edit</button>
                          <button onClick={() => setDeleteId(p._id)} className="text-xs text-red-400 hover:text-red-600 font-medium px-1">Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-500">Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1 px-3 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary text-sm py-1 px-3 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {editModal && <ProductModal product={editModal === 'add' ? null : editModal} onClose={() => setEditModal(null)} onSave={handleSave} />}
      {alertModal && <LowStockAlertModal products={lowStockProducts} onClose={() => setAlertModal(false)} onReorder={handleReorder} />}
      {saleProduct && <SaleForm product={saleProduct} onClose={() => setSaleProduct(null)} onSubmit={handleSale} />}
      {restockProduct && <RestockForm product={restockProduct} onClose={() => setRestockProduct(null)} onSubmit={handleRestock} />}
      {historyProduct && <HistoryModal product={historyProduct} onClose={() => setHistoryProduct(null)} />}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full text-center space-y-4">
            <p className="text-lg font-semibold">Delete this product?</p>
            <p className="text-gray-500 text-sm">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
