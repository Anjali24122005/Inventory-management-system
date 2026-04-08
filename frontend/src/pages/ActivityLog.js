import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const ACTION_STYLE = {
  created: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  updated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/activity', { params: { page, limit: 20 } }).then(({ data }) => {
      setActivities(data.activities);
      setPages(data.pages);
      setTotal(data.total);
      setLoading(false);
    });
  }, [page]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Activity Log</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm">{total} total events</p>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Action</th>
              <th className="text-left px-4 py-3 font-medium">Product</th>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Changes</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : activities.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">No activity yet</td></tr>
            ) : (
              activities.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${ACTION_STYLE[a.action]}`}>
                      {a.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{a.productName}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{a.userName}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs">
                    {Object.keys(a.changes || {}).length > 0 ? (
                      <div className="space-y-0.5">
                        {Object.entries(a.changes).map(([field, change]) => (
                          <div key={field} className="text-xs">
                            <span className="font-medium">{field}:</span>{' '}
                            <span className="line-through text-red-400">{String(change.from)}</span>
                            {' → '}
                            <span className="text-green-500">{String(change.to)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1 px-3 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary text-sm py-1 px-3 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
