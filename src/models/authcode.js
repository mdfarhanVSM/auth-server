const { DataTypes } = require('sequelize');
const sequelize = require('../db/db');
const Client = require('./Client');
 
const AuthCode = sequelize.define('AuthCode', {
  code: {
    type: DataTypes.STRING(512),
    allowNull: false,
    unique: true,
  },
  clientId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Client,
      key: 'clientId',
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  redirectUri: {
    type: DataTypes.STRING(1024),
    allowNull: false,
  },
  scope: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'AuthCodes',
});
 
AuthCode.belongsTo(Client, { foreignKey: 'clientId', targetKey: 'clientId' });
 
module.exports = AuthCode;