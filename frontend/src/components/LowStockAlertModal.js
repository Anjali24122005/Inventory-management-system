import React from 'react';

export default function LowStockAlertModal({ products, onClose, onReorder }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-700">
          <span className="text-3xl">⚠️</span>
          <div>
            <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Critical Stock Alert</h2>
            <p className="text-sm text-gray-500">{products.length} product{products.length > 1 ? 's' : ''} need immediate attention</p>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {products.map((p) => (
            <div key={p._id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-gray-400">{p.supplier}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  p.quantity === 0
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {p.quantity === 0 ? '🚫 Out' : `⚠ ${p.quantity} left`}
                </span>
                <button
                  onClick={() => onReorder(p)}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg transition-colors"
                >
                  Reorder
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Dismiss</button>
        </div>
      </div>
    </div>
  );
}
