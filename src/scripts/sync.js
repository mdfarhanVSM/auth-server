require('dotenv').config();
const sequelize = require('../db/db');
const Client = require('../models/Client');
const Token = require('../models/Token');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection established successfully.');

    await Promise.all([
      Client.sync({ alter: true }),
      Token.sync({ alter: true }),
    ]);
    console.log(' OAuth2 tables synced.');

    const [client, created] = await Client.findOrCreate({
      where: { clientId: process.env.CLIENT_ID },
      defaults: {
        clientSecret: process.env.CLIENT_SECRET,
        grants: 'password,refresh_token',
      }
    });

    console.log(`OAuth client ${created ? 'created' : 'already exists'}: ${client.clientId}`);
  } catch (err) {
    console.error(' Error syncing database:', err.message);
  } finally {
    await sequelize.close();
    console.log(' Database connection closed.');
  }
})();
