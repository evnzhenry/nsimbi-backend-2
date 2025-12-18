const bcrypt = require('bcrypt');
const { sequelize, User, Wallet } = require('./models');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true }); // WARNING: This clears the database!
    console.log('Database synced (cleared).');

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@nsimbi.com',
      password: passwordHash,
      role: 'admin',
    });
    await Wallet.create({ userId: admin.id, balance: 0 });
    console.log('Admin created: admin@nsimbi.com / password123');

    // 2. Create Parent
    const parent = await User.create({
      name: 'John Doe (Parent)',
      email: 'parent@nsimbi.com',
      password: passwordHash,
      role: 'parent',
    });
    await Wallet.create({ userId: parent.id, balance: 500.00 }); // Initial balance
    console.log('Parent created: parent@nsimbi.com / password123');

    // 3. Create Student (linked to Parent)
    const student = await User.create({
      name: 'Jane Doe (Student)',
      email: 'student@nsimbi.com',
      password: passwordHash,
      role: 'student',
      nfcCardId: 'STUDENT_NFC_001',
      studentIdNumber: 'SCH-001',
      studentClass: 'P5',
      parentId: parent.id,
      cardPin: await bcrypt.hash('1234', 10), // Set initial PIN to 1234
    });
    await Wallet.create({ userId: student.id, balance: 50.00 });
    console.log('Student created: student@nsimbi.com / password123 (NFC: STUDENT_NFC_001, ID: SCH-001, PIN: 1234)');

    // 4. Create Merchant
    const merchant = await User.create({
      name: 'Cafeteria Merchant',
      email: 'merchant@nsimbi.com',
      password: passwordHash,
      role: 'merchant',
    });
    await Wallet.create({ userId: merchant.id, balance: 0 });
    console.log('Merchant created: merchant@nsimbi.com / password123');

    console.log('Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
