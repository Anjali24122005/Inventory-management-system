import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const TYPE_STYLE = {
  sale: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  restock: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  initial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const TYPE_LABEL = { sale: '📤 Sale', restock: '📦 Restock', initial: '🆕 Initial' };

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-gray-400 w-28 flex-shrink-0">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function TxnDetails({ txn }) {
  const d = txn.saleDetails || txn.restockDetails || {};
  if (txn.type === 'offline' || txn.saleType === 'offline') return (
    <div className="space-y-1 mt-2 pl-2 border-l-2 border-gray-200 dark:border-gray-600">
      <DetailRow label="Customer" value={d.customerName} />
      <DetailRow label="Phone" value={d.phone} />
      <DetailRow label="Address" value={d.address} />
      <DetailRow label="Purchase Date" value={d.purchaseDate} />
    </div>
  );
  if (txn.saleType === 'amazon' || txn.saleType === 'flipkart') return (
    <div className="space-y-1 mt-2 pl-2 border-l-2 border-gray-200 dark:border-gray-600">
      <DetailRow label="Order/Batch ID" value={d.orderBatchId} />
      <DetailRow label="Delivery Person" value={d.deliveryPersonName} />
      <DetailRow label="Delivery Phone" value={d.deliveryPhone} />
      <DetailRow label="Logistics" value={d.logisticsPartner} />
      <DetailRow label="Dispatch Date" value={d.dispatchDate} />
    </div>
  );
  if (txn.saleType === 'website') return (
    <div className="space-y-1 mt-2 pl-2 border-l-2 border-gray-200 dark:border-gray-600">
      <DetailRow label="Customer" value={d.customerName} />
      <DetailRow label="Order ID" value={d.orderId} />
      <DetailRow label="Contact" value={d.contact} />
      <DetailRow label="Order Date" value={d.orderDate} />
    </div>
  );
  if (txn.type === 'restock') return (
    <div className="space-y-1 mt-2 pl-2 border-l-2 border-gray-200 dark:border-gray-600">
      <DetailRow label="Supplier" value={d.supplierName} />
      <DetailRow label="Contact" value={d.supplierContact} />
      <DetailRow label="Invoice" value={d.invoiceNumber} />
      <DetailRow label="Purchase Date" value={d.purchaseDate} />
    </div>
  );
  return null;
}

export default function HistoryModal({ product, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get(`/transactions?productId=${product._id}&limit=50`).then(({ data }) => {
      setTransactions(data.transactions);
      setLoading(false);
    });
  }, [product._id]);

  const handleExport = async () => {
    const res = await api.get(`/transactions/export/${product._id}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `history-${product.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold">Transaction History</h2>
            <p className="text-sm text-gray-500">{product.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="btn-secondary text-xs py-1.5 px-3">📥 Export CSV</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <p className="text-center text-gray-400 py-8">Loading history...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No transactions yet</p>
          ) : (
            transactions.map((txn) => (
              <div
                key={txn._id}
                className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                onClick={() => setExpanded(expanded === txn._id ? null : txn._id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${TYPE_STYLE[txn.type]}`}>
                      {TYPE_LABEL[txn.type]}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${txn.quantityChange < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {txn.quantityChange > 0 ? '+' : ''}{txn.quantityChange} units
                        </span>
                        <span className="text-xs text-gray-400">
                          {txn.quantityBefore} → {txn.quantityAfter}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        By <span className="font-medium">{txn.handledBy}</span>
                        {txn.saleType && <span> · {txn.saleType}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{new Date(txn.createdAt).toLocaleString()}</p>
                    <p className="text-xs text-blue-500 font-mono">{txn.transactionId}</p>
                  </div>
                </div>

                {expanded === txn._id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <TxnDetails txn={txn} />
                    {txn.remarks && (
                      <p className="text-xs text-gray-500 mt-2">📝 {txn.remarks}</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
