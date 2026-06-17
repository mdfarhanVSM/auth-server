const model = require('../models/oauthModel');

function isValidRedirectUri(client, redirectUri) {
  if (!client.redirectUris || client.redirectUris.length === 0) return false;
  return client.redirectUris.includes(redirectUri);
}
 

function buildRedirectUrl(redirectUri, code, state) {
  const url = new URL(redirectUri);
  url.searchParams.set('code', code);
  if (state) url.searchParams.set('state', state);
  return url.toString();
}

function buildErrorRedirectUrl(redirectUri, error, errorDescription, state) {
  const url = new URL(redirectUri);
  url.searchParams.set('error', error);
  if (errorDescription) url.searchParams.set('error_description', errorDescription);
  if (state) url.searchParams.set('state', state);
  return url.toString();
}
 

const showAuthorize = async (req, res) => {
  const { response_type, client_id, redirect_uri, state, scope } = req.query;
 
  if (!client_id || !redirect_uri || response_type !== 'code') {
    return res.status(400).send('Invalid authorization request. Missing required parameters.');
  }
 
  const client = await model.getClient(client_id, null); 
  if (!client) {
    return res.status(400).send(`Unknown client_id: ${client_id}`);
  }
 
  if (!isValidRedirectUri(client, redirect_uri)) {
    return res.status(400).send('redirect_uri is not registered for this client.');
  }
 
  if (req.session && req.session.user) {
    const sessionUser = req.session.user;
 
    const code = await model.saveAuthorizationCode(client, sessionUser, redirect_uri, scope);
    if (!code) {
      return res.redirect(
        buildErrorRedirectUrl(redirect_uri, 'server_error', 'Failed to generate authorization code', state)
      );
    }
 
    return res.redirect(buildRedirectUrl(redirect_uri, code, state));
  }
 
  return res.render('login', {
    clientId: client_id,
    redirectUri: redirect_uri,
    state: state || '',
    scope: scope || '',
    appName: client.appName || 'KEA',
    error: null,
  });
};
 

const handleAuthorize = async (req, res) => {
  const { client_id, redirect_uri, state, scope, username, password } = req.body;
 
  if (!client_id || !redirect_uri || !username || !password) {
    return res.status(400).send('Missing required fields.');
  }
 
  const client = await model.getClient(client_id, null);
  if (!client) {
    return res.status(400).send(`Unknown client_id: ${client_id}`);
  }
 
  if (!isValidRedirectUri(client, redirect_uri)) {
    return res.status(400).send('Invalid redirect_uri.');
  }
 
  const user = await model.getUser(username, password);
  if (!user) {
    return res.render('login', {
      clientId: client_id,
      redirectUri: redirect_uri,
      state: state || '',
      scope: scope || '',
      appName: client.appName || 'KEA',
      error: 'Invalid username or password.',
    });
  }
 
  req.session.user = {
    id: user.id,
    username: user.username,
    loggedInAt: Date.now(),
  };
 
  req.session.save(async (err) => {
    if (err) {
      console.error(`[AUTH SERVER] Session save error: ${err.message}`);
      return res.redirect(
        buildErrorRedirectUrl(redirect_uri, 'server_error', 'Session error', state)
      );
    }
 
    const code = await model.saveAuthorizationCode(client, user, redirect_uri, scope);
    if (!code) {
      return res.redirect(
        buildErrorRedirectUrl(redirect_uri, 'server_error', 'Failed to generate authorization code', state)
      );
    }
 
    return res.redirect(buildRedirectUrl(redirect_uri, code, state));
  });
};
 
module.exports = {
  showAuthorize,
  handleAuthorize,
};