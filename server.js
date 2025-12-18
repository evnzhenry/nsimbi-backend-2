const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { sequelize, User, Wallet, AppVersion } = require('./models');
const bcrypt = require('bcrypt');
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
sequelize.sync({ force: false })
  .then(async () => {
    console.log('Database connected and synced');
    try {
      // Ensure default admin
      const adminEmail = 'admin@nsimbi.com';
      const existingAdmin = await User.findOne({ where: { email: adminEmail, role: 'admin' } });
      if (!existingAdmin) {
        const passwordHash = await bcrypt.hash('password123', 10);
        const admin = await User.create({
          name: 'Admin User',
          email: adminEmail,
          password: passwordHash,
          role: 'admin',
        });
        await Wallet.create({ userId: admin.id, balance: 0 });
        console.log('Default admin ensured:', adminEmail);
      } else {
        console.log('Default admin exists:', adminEmail);
      }

      // Ensure default update info (for testing)
      const existingUpdate = await AppVersion.findOne({ where: { platform: 'android' } });
      if (!existingUpdate) {
        await AppVersion.create({
          platform: 'android',
          version: '1.0.1',
          buildNumber: 100, // High number to force update prompt for testing
          forceUpdate: false,
          title: 'New Update Available',
          message: 'We have added new features and bug fixes. Please update your app.',
          storeUrl: 'https://play.google.com/store/apps/details?id=com.nsimbi.mobile'
        });
        console.log('Default android update info created');
      }
    } catch (e) {
      console.error('Failed to ensure default data:', e);
    }
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });
