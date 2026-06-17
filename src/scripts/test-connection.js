
require('dotenv').config();
const sequelize = require('../db/db');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection successful (test-connection.js)');
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await sequelize.close();
    console.log(' Connection closed.');
  }
})();
