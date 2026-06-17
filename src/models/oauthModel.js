const Token = require('./Token');
const Client = require('./Client');
const User = require('./User');
const sequelize = require('../db/db');
const bcrypt = require('bcrypt');
const { QueryTypes } = require('sequelize');
const crypto = require('crypto');
const AuthCode = require('./authcode');

const model = {
  async getAccessToken(accessToken) {
    try {
      const token = await Token.findOne({
        where: { accessToken },
        include: [{ model: Client }],
      });

      if (!token) return null;

      return {
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
        scope: token.scope,
        client: {
          id: token.Client.clientId,
          clientId: token.Client.clientId,
          clientSecret: token.Client.clientSecret,
          grants: token.Client.grants.split(','),
        },
        user: {
          id: token.userId,
          username: token.username,
        }
      };
    } catch (error) {
      console.error(`[AUTH SERVER] Error in getAccessToken: ${error.message}`);
      return null;
    }
  },

  async getClient(clientId, clientSecret) {
    try {
      const client = await Client.findOne({ where: { clientId } });
      if (!client) return null;

      if (clientSecret && !await bcrypt.compare(clientSecret, client.clientSecret)) {
        return null;
      }

      return {
        id: client.clientId,
        clientId: client.clientId,
        clientSecret: client.clientSecret,
        grants: client.grants.split(','),
        redirectUris: client.redirectUri            
        ? client.redirectUri.split(',').map(u => u.trim())
        : [],
        appName: client.appName || '', 
      };
    } catch (error) {
      console.error(`[AUTH SERVER] Error in getClient: ${error.message}`);
      return null;
    }
  },

  async getUser(username, plainPassword) {
    try {
      const [result] = await sequelize.query(`
        EXEC dbo.AuthenticateUser 
          @Username = :username, 
          @PlainPassword = :plainPassword
      `, {
        replacements: { username, plainPassword },
        type: QueryTypes.SELECT
      });

      if (!result) return null;

      return {
        id: result.id,
        username: result.Username,
      };
    } catch (error) {
      console.error(`[AUTH SERVER] Error in getUser: ${error.message}`);
      return null;
    }
  },

  async saveToken(token, client, user) {
    try {
      const newToken = await Token.create({
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
        clientId: client.clientId,
        userId: user.id,
        username: user.username,
        scope: token.scope,
        tokenType:'oauth2',
      });

      return {
        accessToken: newToken.accessToken,
        accessTokenExpiresAt: newToken.accessTokenExpiresAt,
        refreshToken: newToken.refreshToken,
        refreshTokenExpiresAt: newToken.refreshTokenExpiresAt,
        scope: newToken.scope,
        client,
        user,
      };
    } catch (error) {
      console.error(`[AUTH SERVER] Error in saveToken: ${error.message}`);
      return null;
    }
  },

  async getRefreshToken(refreshToken) {
    try {
      const token = await Token.findOne({
        where: { refreshToken },
        include: [{ model: Client }],
      });

      if (!token) return null;

      return {
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        scope: token.scope,
        client: {
          id: token.Client.clientId,
          clientId: token.Client.clientId,
          clientSecret: token.Client.clientSecret,
          grants: token.Client.grants.split(','),
        },
        user: {
          id: token.userId,
          username: token.username,
        }
      };
    } catch (error) {
      console.error(`[AUTH SERVER] Error in getRefreshToken: ${error.message}`);
      return null;
    }
  },

  async revokeToken(token) {
    try {
      const whereClause = token.refreshToken
        ? { refreshToken: token.refreshToken }
        : { accessToken: token.accessToken };

      const result = await Token.destroy({ where: whereClause });
      return result > 0;
    } catch (error) {
      console.error(`[AUTH SERVER] Error revoking token: ${error.message}`);
      return false;
    }
  },

  async getAuthorizationCode(code) {
    try {
      const authCode = await AuthCode.findOne({
        where: { code },
        include: [{ model: Client }],
      });
 
      if (!authCode) return null;
 
      return {
        code: authCode.code,
        expiresAt: authCode.expiresAt,
        redirectUri: authCode.redirectUri,
        scope: authCode.scope,
        client: {
          id: authCode.Client.clientId,
          clientId: authCode.Client.clientId,
          grants: authCode.Client.grants.split(','),
          redirectUris: authCode.Client.redirectUri
            ? authCode.Client.redirectUri.split(',').map((u) => u.trim())
            : [],
        },
        user: {
          id: authCode.userId,
          username: authCode.username,
        },
      };
    } catch (error) {
      console.error(`[AUTH SERVER] Error in getAuthorizationCode: ${error.message}`);
      return null;
    }
  },
 

  async saveAuthorizationCode(client, user, redirectUri, scope) {
    try {
      const code = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 
 
      await AuthCode.create({
        code,
        clientId: client.clientId,
        userId: user.id,
        username: user.username,
        redirectUri,
        scope: scope || null,
        expiresAt,
        used: false,
      });
 
      return code;
    } catch (error) {
      console.error(`[AUTH SERVER] Error in saveAuthorizationCode: ${error.message}`);
      return null;
    }
  },
 

  async revokeAuthorizationCode(code) {
    try {
      const result = await AuthCode.destroy({ where: { code: code.code } });
      return result > 0;
    } catch (error) {
      console.error(`[AUTH SERVER] Error in revokeAuthorizationCode: ${error.message}`);
      return false;
    }
  },

 
};

module.exports = model;
