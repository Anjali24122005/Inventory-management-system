const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');

dotenv.config();

const products = [
  { name: 'Laptop Pro 15', category: 'Electronics', quantity: 25, price: 1299.99, supplier: 'TechCorp', sku: 'ELEC-001', lowStockThreshold: 5 },
  { name: 'Wireless Mouse', category: 'Electronics', quantity: 8, price: 29.99, supplier: 'TechCorp', sku: 'ELEC-002', lowStockThreshold: 10 },
  { name: 'USB-C Hub', category: 'Electronics', quantity: 0, price: 49.99, supplier: 'GadgetWorld', sku: 'ELEC-003', lowStockThreshold: 5 },
  { name: 'Office Chair', category: 'Furniture', quantity: 12, price: 349.99, supplier: 'FurniturePlus', sku: 'FURN-001', lowStockThreshold: 3 },
  { name: 'Standing Desk', category: 'Furniture', quantity: 4, price: 599.99, supplier: 'FurniturePlus', sku: 'FURN-002', lowStockThreshold: 5 },
  { name: 'Notebook A4', category: 'Stationery', quantity: 200, price: 3.99, supplier: 'OfficeSupplies', sku: 'STAT-001', lowStockThreshold: 50 },
  { name: 'Ballpoint Pens (Box)', category: 'Stationery', quantity: 45, price: 8.99, supplier: 'OfficeSupplies', sku: 'STAT-002', lowStockThreshold: 20 },
  { name: 'Monitor 27"', category: 'Electronics', quantity: 7, price: 399.99, supplier: 'TechCorp', sku: 'ELEC-004', lowStockThreshold: 5 },
  { name: 'Mechanical Keyboard', category: 'Electronics', quantity: 3, price: 149.99, supplier: 'GadgetWorld', sku: 'ELEC-005', lowStockThreshold: 5 },
  { name: 'Printer Paper (Ream)', category: 'Stationery', quantity: 0, price: 12.99, supplier: 'OfficeSupplies', sku: 'STAT-003', lowStockThreshold: 10 },
  { name: 'Webcam HD', category: 'Electronics', quantity: 15, price: 79.99, supplier: 'GadgetWorld', sku: 'ELEC-006', lowStockThreshold: 5 },
  { name: 'Bookshelf', category: 'Furniture', quantity: 6, price: 199.99, supplier: 'FurniturePlus', sku: 'FURN-003', lowStockThreshold: 2 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Product.deleteMany({});

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@inventory.com',
    password: 'admin123',
    role: 'admin',
  });

  await User.create({
    name: 'Staff Member',
    email: 'staff@inventory.com',
    password: 'staff123',
    role: 'staff',
  });

  await Product.insertMany(products);

  console.log('Seed complete!');
  console.log('Admin: admin@inventory.com / admin123');
  console.log('Staff: staff@inventory.com / staff123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
