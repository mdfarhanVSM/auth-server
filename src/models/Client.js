const { DataTypes } = require('sequelize');
const sequelize = require('../db/db');
const bcrypt = require('bcrypt');

const bcryptCost = parseInt(process.env.BCRYPT_COST, 10) || 10;

const Client = sequelize.define('Client', {
    clientId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    clientSecret: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    grants: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    redirectUri: {
        type: DataTypes.STRING(2048),
        allowNull: true,
  },
    appName: {
        type: DataTypes.STRING,
        allowNull: true,
  },
  logoutUri: {
     type: DataTypes.STRING(2048), 
     allowNull: true 
    }
}, {
    tableName: 'Clients',
});

Client.beforeCreate(async (client) => {
    client.clientSecret = await bcrypt.hash(client.clientSecret, bcryptCost);
});

module.exports = Client;
