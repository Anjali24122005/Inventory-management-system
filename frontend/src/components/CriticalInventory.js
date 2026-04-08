import React from 'react';
import { useAlert } from '../context/AlertContext';

export default function CriticalInventory({ onReorder }) {
  const { lowStockProducts } = useAlert();

  if (lowStockProducts.length === 0) return null;

  return (
    <div className="card border-red-200 dark:border-red-800 p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800">
        <span className="text-lg critical-pulse">⚠️</span>
        <h2 className="font-bold text-red-700 dark:text-red-400">Critical Inventory</h2>
        <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
          {lowStockProducts.length}
        </span>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {lowStockProducts.map((p) => (
          <div key={p._id} className="flex items-center justify-between px-5 py-3 low-stock-row">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{p.name}</span>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 critical-badge">
                    ⚠ Critical
                  </span>
                </div>
                <p className="text-xs text-gray-400">{p.category} · {p.supplier}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                p.quantity === 0
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {p.quantity === 0 ? 'Out of Stock' : `${p.quantity} / ${p.lowStockThreshold} threshold`}
              </span>
              <button
                onClick={() => onReorder(p)}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                🔄 Reorder
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
