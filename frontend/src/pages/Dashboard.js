import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const StatCard = ({ label, value, icon, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`text-4xl p-3 rounded-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const actionColor = { created: 'text-green-600', updated: 'text-blue-600', deleted: 'text-red-600' };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(({ data }) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={stats.totalProducts} icon="📦" color="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard label="Total Value" value={`₹${stats.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon="💰" color="bg-green-50 dark:bg-green-900/20" />
        <StatCard label="Low Stock" value={stats.lowStock} icon="⚠️" color="bg-yellow-50 dark:bg-yellow-900/20" />
        <StatCard label="Out of Stock" value={stats.outOfStock} icon="🚫" color="bg-red-50 dark:bg-red-900/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Products by Category</h2>
          <div className="space-y-3">
            {stats.categoryBreakdown.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="text-sm w-32 truncate text-gray-600 dark:text-gray-400">{cat.name}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(cat.count / stats.totalProducts) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-6 text-right">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {stats.recentActivity.length === 0 && (
              <p className="text-gray-400 text-sm">No activity yet</p>
            )}
            {stats.recentActivity.map((a) => (
              <div key={a._id} className="flex items-start gap-3 text-sm">
                <span className={`font-medium capitalize ${actionColor[a.action]}`}>{a.action}</span>
                <div className="flex-1">
                  <span className="font-medium">{a.productName}</span>
                  <span className="text-gray-400"> by {a.userName}</span>
                </div>
                <span className="text-gray-400 text-xs whitespace-nowrap">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low stock alert */}
      {stats.lowStock > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-300">Low Stock Alert</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              {stats.lowStock} product{stats.lowStock > 1 ? 's are' : ' is'} running low on stock.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
