import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_STYLE = {
  sale: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  restock: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  initial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const TYPE_LABEL = { sale: '📤 Sale', restock: '📦 Restock', initial: '🆕 Initial' };

const SALE_TYPE_LABEL = {
  offline: '🏪 Offline',
  amazon: '🛒 Amazon',
  flipkart: '🛍️ Flipkart',
  website: '🌐 Website',
};

// ─── Detail Rows ──────────────────────────────────────────────────────────────

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-gray-400 dark:text-gray-500 w-32 flex-shrink-0">{label}:</span>
      <span className="font-medium text-gray-700 dark:text-gray-300">{value}</span>
    </div>
  );
}

function TxnDetails({ txn }) {
  const d = txn.saleDetails || txn.restockDetails || {};

  if (txn.saleType === 'offline') return (
    <div className="space-y-1 mt-2 pl-3 border-l-2 border-gray-200 dark:border-gray-600">
      <DetailRow label="Customer" value={d.customerName} />
      <DetailRow label="Phone" value={d.phone} />
      <DetailRow label="Address" value={d.address} />
      <DetailRow label="Purchase Date" value={d.purchaseDate} />
    </div>
  );

  if (txn.saleType === 'amazon' || txn.saleType === 'flipkart') return (
    <div className="space-y-1 mt-2 pl-3 border-l-2 border-gray-200 dark:border-gray-600">
      <DetailRow label="Order / Batch ID" value={d.orderBatchId} />
      <DetailRow label="Delivery Person" value={d.deliveryPersonName} />
      <DetailRow label="Delivery Phone" value={d.deliveryPhone} />
      <DetailRow label="Logistics" value={d.logisticsPartner} />
      <DetailRow label="Dispatch Date" value={d.dispatchDate} />
    </div>
  );

  if (txn.saleType === 'website') return (
    <div className="space-y-1 mt-2 pl-3 border-l-2 border-gray-200 dark:border-gray-600">
      <DetailRow label="Customer" value={d.customerName} />
      <DetailRow label="Order ID" value={d.orderId} />
      <DetailRow label="Contact" value={d.contact} />
      <DetailRow label="Order Date" value={d.orderDate} />
    </div>
  );

  if (txn.type === 'restock') return (
    <div className="space-y-1 mt-2 pl-3 border-l-2 border-gray-200 dark:border-gray-600">
      <DetailRow label="Supplier" value={d.supplierName} />
      <DetailRow label="Contact" value={d.supplierContact} />
      <DetailRow label="Invoice" value={d.invoiceNumber} />
      <DetailRow label="Purchase Date" value={d.purchaseDate} />
    </div>
  );

  return null;
}

// ─── Summary Stats Card ───────────────────────────────────────────────────────

function StatCard({ label, value, color }) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [saleTypeFilter, setSaleTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Expanded row
  const [expanded, setExpanded] = useState(null);

  // Stats derived from current page data (for all-time totals, we track separately)
  const [stats, setStats] = useState({ sales: 0, restocks: 0, initial: 0, totalQtyOut: 0, totalQtyIn: 0 });

  const fetchTransactions = useCallback(async (currentPage) => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 20 };
      if (typeFilter) params.type = typeFilter;
      const { data } = await api.get('/transactions', { params });
      setTransactions(data.transactions);
      setPages(data.pages);
      setTotal(data.total);

      // Compute quick stats from ALL fetched data for this filter set
      // We fetch a larger batch once for stats
      const { data: allData } = await api.get('/transactions', { params: { ...params, page: 1, limit: 1000 } });
      const all = allData.transactions || [];
      setStats({
        sales: all.filter((t) => t.type === 'sale').length,
        restocks: all.filter((t) => t.type === 'restock').length,
        initial: all.filter((t) => t.type === 'initial').length,
        totalQtyOut: all.filter((t) => t.type === 'sale').reduce((s, t) => s + Math.abs(t.quantityChange), 0),
        totalQtyIn: all.filter((t) => t.type !== 'sale').reduce((s, t) => s + t.quantityChange, 0),
      });
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions(page);
  }, [page, fetchTransactions]);

  // Client-side filter for search & date (server doesn't support these yet)
  const filtered = transactions.filter((txn) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      txn.productName?.toLowerCase().includes(q) ||
      txn.transactionId?.toLowerCase().includes(q) ||
      txn.handledBy?.toLowerCase().includes(q);

    const matchesSaleType = !saleTypeFilter || txn.saleType === saleTypeFilter;

    const txnDate = new Date(txn.createdAt);
    const matchesFrom = !dateFrom || txnDate >= new Date(dateFrom);
    const matchesTo = !dateTo || txnDate <= new Date(dateTo + 'T23:59:59');

    return matchesSearch && matchesSaleType && matchesFrom && matchesTo;
  });

  const handleExportAll = async () => {
    // Build CSV from current filtered view
    const fields = ['transactionId', 'productName', 'type', 'saleType', 'quantityChange', 'quantityBefore', 'quantityAfter', 'handledBy', 'remarks', 'createdAt'];
    const header = fields.join(',');
    const rows = filtered.map((t) =>
      fields.map((f) => `"${t[f] ?? ''}"`).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setSaleTypeFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters = search || typeFilter || saleTypeFilter || dateFrom || dateTo;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            All transactions across every product — {total} total
          </p>
        </div>
        <button
          onClick={handleExportAll}
          className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Total Sales" value={stats.sales} color="text-red-600 dark:text-red-400" />
        <StatCard label="Total Restocks" value={stats.restocks} color="text-green-600 dark:text-green-400" />
        <StatCard label="Initial Stocks" value={stats.initial} color="text-blue-600 dark:text-blue-400" />
        <StatCard label="Units Sold" value={stats.totalQtyOut} color="text-orange-600 dark:text-orange-400" />
        <StatCard label="Units Added" value={stats.totalQtyIn} color="text-teal-600 dark:text-teal-400" />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Search</label>
            <input
              type="text"
              placeholder="Product, Transaction ID, handled by..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full text-sm"
            />
          </div>

          {/* Type filter */}
          <div className="min-w-36">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-full text-sm"
            >
              <option value="">All Types</option>
              <option value="sale">Sale</option>
              <option value="restock">Restock</option>
              <option value="initial">Initial</option>
            </select>
          </div>

          {/* Sale type filter */}
          <div className="min-w-36">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Channel</label>
            <select
              value={saleTypeFilter}
              onChange={(e) => setSaleTypeFilter(e.target.value)}
              className="input w-full text-sm"
            >
              <option value="">All Channels</option>
              <option value="offline">Offline</option>
              <option value="amazon">Amazon</option>
              <option value="flipkart">Flipkart</option>
              <option value="website">Website</option>
            </select>
          </div>

          {/* Date from */}
          <div className="min-w-36">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input w-full text-sm"
            />
          </div>

          {/* Date to */}
          <div className="min-w-36">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input w-full text-sm"
            />
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors self-end pb-2"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Transactions list */}
      <div className="space-y-3">
        {loading ? (
          <div className="card p-12 text-center text-gray-400">
            <div className="text-3xl mb-2">⏳</div>
            <p>Loading transactions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <div className="text-3xl mb-2">📭</div>
            <p>No transactions found{hasFilters ? ' for the selected filters' : ''}.</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-3 text-blue-500 text-sm hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filtered.map((txn) => (
            <div
              key={txn._id}
              className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setExpanded(expanded === txn._id ? null : txn._id)}
            >
              {/* Row summary */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* Left: type badge + qty + product */}
                <div className="flex items-start gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${TYPE_STYLE[txn.type]}`}>
                    {TYPE_LABEL[txn.type]}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-sm ${txn.quantityChange < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {txn.quantityChange > 0 ? '+' : ''}{txn.quantityChange} units
                      </span>
                      <span className="text-xs text-gray-400">
                        {txn.quantityBefore} → {txn.quantityAfter}
                      </span>
                      {txn.saleType && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                          {SALE_TYPE_LABEL[txn.saleType] || txn.saleType}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
                      {txn.productName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      By <span className="font-medium">{txn.handledBy}</span>
                    </p>
                  </div>
                </div>

                {/* Right: date + txn ID + expand indicator */}
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <p className="text-xs text-gray-400">
                    {new Date(txn.createdAt).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  <p className="text-xs font-mono text-blue-500">{txn.transactionId}</p>
                  <span className="text-xs text-gray-400">{expanded === txn._id ? '▲ Hide' : '▼ Details'}</span>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === txn._id && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Transaction meta */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Transaction Info
                      </p>
                      <DetailRow label="Transaction ID" value={txn.transactionId} />
                      <DetailRow label="Product" value={txn.productName} />
                      <DetailRow label="Type" value={txn.type} />
                      <DetailRow label="Channel" value={txn.saleType ? (SALE_TYPE_LABEL[txn.saleType] || txn.saleType) : null} />
                      <DetailRow label="Handled By" value={txn.handledBy} />
                      <DetailRow label="Date & Time" value={new Date(txn.createdAt).toLocaleString()} />
                      {txn.remarks && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded p-2">
                          📝 {txn.remarks}
                        </div>
                      )}
                    </div>

                    {/* Platform-specific details */}
                    {(txn.saleType || txn.type === 'restock') && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                          {txn.type === 'restock' ? 'Supplier Details' : 'Sale Details'}
                        </p>
                        <TxnDetails txn={txn} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {pages} · {total} transactions
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm py-1.5 px-4 disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="btn-secondary text-sm py-1.5 px-4 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
