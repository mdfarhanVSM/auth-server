require('dotenv').config();
const { Op } = require('sequelize');
const sequelize = require('../db/db');
const Token = require('../models/Token');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('[CLEANUP] DB connection successful.');

    const deletedCount = await Token.destroy({
      where: {
        accessTokenExpiresAt: {
          [Op.lt]: new Date()
        }
      }
    });

    console.log(`[CLEANUP] Deleted ${deletedCount} expired tokens.`);
  } catch (error) {
    console.error('[CLEANUP] Error during cleanup:', error.message);
  } finally {
    await sequelize.close();
    console.log('[CLEANUP] DB connection closed.');
  }
})();
