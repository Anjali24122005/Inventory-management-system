import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const alertedIds = useRef(new Set()); // track already-alerted products

  const fetchLowStock = async () => {
    try {
      const { data } = await api.get('/products', { params: { limit: 100 } });
      const low = data.products.filter(
        (p) => p.stockStatus === 'low_stock' || p.stockStatus === 'out_of_stock'
      );
      setLowStockProducts(low);

      // Simulate alert only for newly detected low stock items
      low.forEach((p) => {
        if (!alertedIds.current.has(p._id)) {
          alertedIds.current.add(p._id);
          simulateAlert(p);
        }
      });
    } catch {
      // silently fail
    }
  };

  // Simulate email/WhatsApp alert
  const simulateAlert = (product) => {
    const msg = `⚠ Low Stock Alert: "${product.name}" has only ${product.quantity} units left.`;
    console.log('[EMAIL ALERT]', msg);
    console.log('[WHATSAPP ALERT]', msg);
    // To integrate Twilio: POST to /api/alerts/sms with { to, message }
    // To integrate EmailJS: emailjs.send(serviceId, templateId, { product_name, quantity })
    toast(`📦 Low stock: ${product.name} (${product.quantity} left)`, {
      icon: '⚠️',
      style: { background: '#fef3c7', color: '#92400e' },
      duration: 4000,
    });
  };

  useEffect(() => {
    fetchLowStock();
    const interval = setInterval(fetchLowStock, 60000); // re-check every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <AlertContext.Provider value={{ lowStockProducts, refetch: fetchLowStock }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
