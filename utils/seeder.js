const { User, Wallet, AppVersion } = require('../models');
const bcrypt = require('bcrypt');
const logger = require('./logger');

const seedDatabase = async () => {
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
      logger.info(`Default super_admin created: ${adminEmail}`);
    } else if (admin.role !== 'super_admin') {
      // Upgrade existing admin to super_admin
      admin.role = 'super_admin';
      await admin.save();
      logger.info(`Existing admin upgraded to super_admin: ${adminEmail}`);
    } else {
      logger.info(`Default super_admin exists: ${adminEmail}`);
    }

    // Migrate any remaining 'admin' users to 'campus_admin'
    const [updatedRows] = await User.update(
      { role: 'campus_admin' },
      { where: { role: 'admin' } }
    );
    if (updatedRows > 0) {
      logger.info(`Migrated ${updatedRows} legacy 'admin' users to 'campus_admin'`);
    }

    // Ensure default update info (for testing)
    const existingUpdate = await AppVersion.findOne({ where: { platform: 'android' } });
    if (!existingUpdate) {
      await AppVersion.create({
        platform: 'android',
        version: '1.0.1',
        buildNumber: 100,
        forceUpdate: false,
        title: 'New Update Available',
        message: 'We have added new features and bug fixes. Please update your app.',
        storeUrl: 'https://play.google.com/store/apps/details?id=com.nsimbi.mobile'
      });
      logger.info('Default android update info created');
    }
  } catch (error) {
    logger.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;
