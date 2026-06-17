const { DataTypes } = require("sequelize");
const sequelize = require("../db/db.js");
const Client = require("./Client");

const Token = sequelize.define(
  "Token",
  {
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    accessTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refreshTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    clientId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Client,
        key: "clientId",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
    },
    tokenType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "Tokens",
  },
);

Token.belongsTo(Client, { foreignKey: "clientId", targetKey: "clientId" });

module.exports = Token;
