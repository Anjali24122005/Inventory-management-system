import React, { useState, useRef, useEffect } from 'react';
import { useAlert } from '../context/AlertContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { lowStockProducts } = useAlert();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const count = lowStockProducts.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <span className="text-xl">🔔</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <span className="font-semibold text-sm">Low Stock Alerts</span>
            <span className="text-xs text-red-500 font-medium">{count} items</span>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {count === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">All stock levels are fine ✅</p>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-50 dark:border-gray-700 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    p.quantity === 0
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {p.quantity === 0 ? 'Out of Stock' : `${p.quantity} left`}
                  </span>
                </div>
              ))
            )}
          </div>

          {count > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => { navigate('/products?stock=low_stock'); setOpen(false); }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline w-full text-center"
              >
                View all in Products →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
