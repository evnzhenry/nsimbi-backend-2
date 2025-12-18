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
const updateRoutes = require('./routes/updateRoutes');
const adminRoutes = require('./routes/adminRoutes');

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
app.use('/api/updates', updateRoutes);
app.use('/api/admin', adminRoutes);

// Database Sync and Server Start
// Note: We use { force: false } because seed.js already handles table creation.
// Avoid { alter: true } with SQLite as it can cause foreign key constraint errors during development.
sequelize.sync({ force: false })
  .then(async () => {
    console.log('Database connected and synced');
    try {
      // Ensure default super admin
      const adminEmail = 'admin@nsimbi.com';
      let admin = await User.findOne({ where: { email: adminEmail } });
      
      if (!admin) {
        const passwordHash = await bcrypt.hash('password123', 10);
        admin = await User.create({
          name: 'Super Admin',
          email: adminEmail,
          password: passwordHash,
          role: 'super_admin',
        });
        await Wallet.create({ userId: admin.id, balance: 0 });
        console.log('Default super_admin created:', adminEmail);
      } else if (admin.role !== 'super_admin') {
        // Upgrade existing admin to super_admin
        admin.role = 'super_admin';
        await admin.save();
        console.log('Existing admin upgraded to super_admin:', adminEmail);
      } else {
        console.log('Default super_admin exists:', adminEmail);
      }

      // Migrate any remaining 'admin' users to 'campus_admin'
      const [updatedRows] = await User.update(
        { role: 'campus_admin' },
        { where: { role: 'admin' } }
      );
      if (updatedRows > 0) {
        console.log(`Migrated ${updatedRows} legacy 'admin' users to 'campus_admin'`);
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
