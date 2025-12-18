const sequelize = require('../config/database');
const User = require('./User');
const Wallet = require('./Wallet');
const Transaction = require('./Transaction');
const Item = require('./Item');

// User <-> Wallet
User.hasOne(Wallet, { foreignKey: 'userId' });
Wallet.belongsTo(User, { foreignKey: 'userId' });

// User <-> User (Parent/Student relationship)
User.hasMany(User, { as: 'Students', foreignKey: 'parentId' });
User.belongsTo(User, { as: 'Parent', foreignKey: 'parentId' });

// Transaction Associations
User.hasMany(Transaction, { as: 'SentTransactions', foreignKey: 'fromUserId' });
User.hasMany(Transaction, { as: 'ReceivedTransactions', foreignKey: 'toUserId' });

Transaction.belongsTo(User, { as: 'Sender', foreignKey: 'fromUserId' });
Transaction.belongsTo(User, { as: 'Receiver', foreignKey: 'toUserId' });

// Inventory Associations
User.hasMany(Item, { foreignKey: 'merchantId', as: 'Inventory' });
Item.belongsTo(User, { foreignKey: 'merchantId', as: 'Merchant' });

module.exports = {
  sequelize,
  User,
  Wallet,
  Transaction,
  Item,
  AppVersion,
};
