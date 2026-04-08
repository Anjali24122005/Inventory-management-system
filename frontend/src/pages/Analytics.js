import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/products', { params: { limit: 100 } }),
    ]).then(([s, p]) => {
      setStats(s.data);
      setProducts(p.data.products);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading analytics...</div>;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const categoryData = {
    labels: stats.categoryBreakdown.map((c) => c.name),
    datasets: [
      {
        data: stats.categoryBreakdown.map((c) => c.count),
        backgroundColor: COLORS,
        borderWidth: 0,
      },
    ],
  };

  // Top 10 products by value
  const topProducts = [...products]
    .map((p) => ({ ...p, value: p.price * p.quantity }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const barData = {
    labels: topProducts.map((p) => p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name),
    datasets: [
      {
        label: 'Inventory Value ($)',
        data: topProducts.map((p) => p.value.toFixed(2)),
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
    ],
  };

  const stockData = {
    labels: ['In Stock', 'Low Stock', 'Out of Stock'],
    datasets: [
      {
        data: [
          products.filter((p) => p.stockStatus === 'in_stock').length,
          products.filter((p) => p.stockStatus === 'low_stock').length,
          products.filter((p) => p.stockStatus === 'out_of_stock').length,
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Top Products by Value</h2>
          <Bar data={barData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { display: false } } }} />
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Products by Category</h2>
          <div className="max-w-xs mx-auto">
            <Doughnut data={categoryData} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Stock Status Overview</h2>
          <div className="max-w-xs mx-auto">
            <Doughnut data={stockData} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Inventory Summary</h2>
          <div className="space-y-4">
            {[
              { label: 'Total Products', value: stats.totalProducts },
              { label: 'Total Inventory Value', value: `₹${stats.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
              { label: 'Low Stock Items', value: stats.lowStock },
              { label: 'Out of Stock Items', value: stats.outOfStock },
              { label: 'Categories', value: stats.categoryBreakdown.length },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
