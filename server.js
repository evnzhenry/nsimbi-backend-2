const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { sequelize } = require('./models');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression()); // Compress responses
app.use(morgan('combined')); // Production logging
app.use(cors());

// Rate Limiting - Basic protection against DDoS / Brute Force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin/user', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/inventory', inventoryRoutes);

// Database Sync and Server Start
// Note: We use { force: false } because seed.js already handles table creation.
// Avoid { alter: true } with SQLite as it can cause foreign key constraint errors during development.
sequelize.sync({ force: false }).then(() => {
  console.log('Database connected and synced');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Database connection failed:', err);
});
