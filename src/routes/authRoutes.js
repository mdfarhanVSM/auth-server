const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { showAuthorize, handleAuthorize } = require('../controllers/authorizeController');

router.post('/oauth/token', authController.token);

router.post('/validate-token', authController.validateToken);

router.post('/oauth/introspect', authController.introspectToken);

router.post('/oauth/revoke', authController.revoke);

router.get('/logout', authController.handleLogout);

router.get('/sso-logout', authController.showSsoLogout);

router.get('/oauth/authorize', showAuthorize);

router.post('/oauth/authorize', handleAuthorize);

module.exports = router;