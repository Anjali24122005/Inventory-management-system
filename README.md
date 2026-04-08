<<<<<<< HEAD
# InvenTrack - Inventory Management System

## Setup Instructions

### Prerequisites
- Node.js >= 16
- MongoDB running locally or a MongoDB Atlas URI

---

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run seed    # Load sample data
npm run dev     # Start backend on port 5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start       # Start React app on port 3000
```

---

### .env Variables

| Variable    | Description                        |
|-------------|------------------------------------|
| PORT        | Backend port (default 5000)        |
| MONGO_URI   | MongoDB connection string          |
| JWT_SECRET  | Secret key for JWT signing         |
| JWT_EXPIRE  | Token expiry (e.g. 7d)             |

---

### Demo Credentials (after seeding)

| Role  | Email                    | Password  |
|-------|--------------------------|-----------|
| Admin | admin@inventory.com      | admin123  |
| Staff | staff@inventory.com      | staff123  |

---

### Features

- JWT authentication with bcrypt password hashing
- Dashboard with stats, category breakdown, recent activity
- Full product CRUD with search, filter, sort, pagination
- Low stock alerts and out-of-stock tracking
- Inventory activity log (who changed what and when)
- Analytics with Bar and Doughnut charts
- Export inventory to CSV
- Dark mode toggle
- Responsive sidebar layout
=======
# Inventory-management-system
>>>>>>> 12c47c49d1f3f3ef214f7c44aad8209730ebd9a3
