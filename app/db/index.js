// db.js
const { Sequelize } = require('sequelize');

// Initialize a Sequelize instance and connect to the SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'db.sqlite', // Path to your SQLite database file
  logging: false,  // Disable logging for cleaner console output
});

module.exports = sequelize;
