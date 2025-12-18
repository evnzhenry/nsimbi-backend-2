const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use SQLite for MVP simplicity if Postgres is not available
// In production, set IS_POSTGRES=true in .env
const isPostgres = process.env.IS_POSTGRES === 'true';

let sequelize;

if (isPostgres) {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      logging: false, // Set to console.log to see SQL queries
      pool: {
        max: parseInt(process.env.DB_POOL_MAX || '20'),
        min: parseInt(process.env.DB_POOL_MIN || '0'),
        acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
        idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
      },
    }
  );
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite', // File-based DB
    logging: false,
    // SQLite doesn't really use a pool in the same way, but Sequelize supports it
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
  });
}

module.exports = sequelize;
