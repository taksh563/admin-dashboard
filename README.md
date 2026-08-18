# 🚀 MERN Admin Dashboard

A modern, responsive, and scalable **MERN Stack Admin Dashboard** built with React, Node.js, Express.js, and MongoDB.

This project provides a centralized administration system for managing users, products, categories, email functionality, audit logs, authentication, and dashboard analytics. The application follows a modular architecture designed for scalability, maintainability, security, and real-world production use.

---

## 📌 Project Overview

The MERN Admin Dashboard is a full-stack administration platform that allows administrators to manage application data and monitor system activities from a single interface.

The dashboard includes:

- 🔐 JWT-based authentication
- 👥 User management
- 📦 Product management
- 🏷️ Category management
- 📧 Email management
- 📋 Audit/activity logging
- 📊 Dynamic dashboard statistics
- 🔎 Advanced filtering
- 📄 Server-side pagination
- 📝 CRUD operations
- 🔄 Status management
- 👁️ Detailed record views
- 📱 Responsive UI
- 🌓 Modern admin interface
- 🔔 Toast notifications
- 🧭 Dynamic browser tab titles

---

## ✨ Features

### 🔐 Authentication & Authorization

Secure authentication system using JWT.

- User registration
- User login
- JWT authentication
- Protected routes
- Authentication context
- Session management
- Logout
- Password hashing
- Authenticated API requests
- Unauthorized request handling

---

### 👥 User Management

Complete user administration functionality.

- User listing
- Create user
- Edit user
- Delete user
- User status management
- Active/inactive users
- Search users
- Filter users
- Pagination
- User details
- Form validation

---

### 📦 Product Management

Complete product CRUD management with category relationships.

- Create products
- Edit products
- Delete products
- Product status management
- Multiple category selection
- Product search
- Product filtering
- Pagination
- Product details
- Category relationships
- Form validation

**Example product structure:**

```text
Product
 ├── Name
 ├── Description
 ├── SKU
 ├── Price
 ├── Categories
 ├── Status
 └── Created/Updated Date
```

---

### 🏷️ Category Management

Manage product categories used across the platform.

- Create categories
- Edit categories
- Delete categories
- Category status management
- Category listing
- Search & filter categories
- Pagination

---

### 📧 Email Management

Manage and track email communication from the admin panel.

- Send emails
- Email templates
- Email history/logs
- Status tracking (sent/failed)
- Search & filter emails

---

### 📋 Audit / Activity Logging

Track and monitor system activity for accountability and security.

- Action logging (create/update/delete)
- User activity tracking
- Timestamped records
- Filter logs by user, action, or date
- Pagination

---

### 📊 Dashboard & Analytics

Centralized overview of system data and statistics.

- Dynamic statistics widgets
- Summary cards (users, products, categories, etc.)
- Data visualization
- Recent activity overview

---

## 🛠️ Tech Stack

| Layer            | Technology                     |
|-------------------|--------------------------------|
| Frontend          | React.js                       |
| Backend           | Node.js, Express.js            |
| Database          | MongoDB, Mongoose              |
| Authentication    | JWT (JSON Web Tokens)          |
| Styling           | CSS / Tailwind (or as configured) |
| Notifications     | Toast notifications library    |
| API Communication | Axios / Fetch                  |

---

## 📂 Project Structure

```text
mern-admin-dashboard/
├── client/                # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   └── package.json
├── server/                # Express backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
├── .env.example
├── README.md
└── package.json
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/mern-admin-dashboard.git
cd mern-admin-dashboard
```

### 2. Install dependencies

**Backend**

```bash
cd server
npm install
```

**Frontend**

```bash
cd ../client
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

### 4. Run the application

**Backend**

```bash
cd server
npm run dev
```

**Frontend**

```bash
cd client
npm start
```

The app should now be running at `http://localhost:3000` with the API served from `http://localhost:5000`.

---

## 🔎 API Overview

| Module     | Base Route        |
|------------|--------------------|
| Auth       | `/api/auth`        |
| Users      | `/api/users`        |
| Products   | `/api/products`     |
| Categories | `/api/categories`   |
| Emails     | `/api/emails`       |
| Audit Logs | `/api/audit-logs`   |
| Dashboard  | `/api/dashboard`    |

> All protected routes require a valid JWT sent via the `Authorization` header.

---

## 🧪 Scripts

| Command         | Description                     |
|------------------|----------------------------------|
| `npm run dev`    | Run backend in development mode |
| `npm start`      | Run frontend / production server |
| `npm run build`  | Build frontend for production   |
| `npm test`       | Run tests (if configured)       |

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 📬 Contact

For questions, issues, or suggestions, please open an issue in the repository.
