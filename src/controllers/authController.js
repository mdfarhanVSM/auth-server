const { Request, Response } = require('oauth2-server');
const model = require('../models/oauthModel'); 
const Client = require('../models/Client');
const { Op } = require('sequelize');
const Token = require('../models/Token');

const token = async (req, res) => {
  const oauth = req.app.locals.oauth;
  const request = new Request(req);
  const response = new Response(res);

  try {
    const token = await oauth.token(request, response);
    const expiresIn = Math.floor(
      (token.accessTokenExpiresAt.getTime() - Date.now()) / 1000
    );

    const clientResponse = {
      access_token: token.accessToken,
      expires_in: expiresIn,
      token_type: 'Bearer',
      user:token.user,
    };

    if (token.refreshToken) {
      clientResponse.refresh_token = token.refreshToken;
    }

    return res.json(clientResponse);
  } catch (err) {
    console.error(`[AUTH SERVER] Token error: ${err.message}`);
    res.status(err.code || 500).json({
      error: err.name,
      error_description: err.message,
      details: {
        headers: req.headers,
        body: req.body,
        serverTime: new Date().toISOString(),
      },
    });
  }
};

const validateToken = async (req, res) => {
  const oauth = req.app.locals.oauth;
  const request = new Request(req);
  const response = new Response(res);

  const authHeader = req.headers.authorization;

  try {
    const token = await oauth.authenticate(request, response);

    res.json({
      message: 'Token is valid',
      user: token.user,
      client: token.client,
      token: token,
    });
  } catch (err) {
    console.error(`[AUTH SERVER] Token validation error: ${err.message}`);
    res.status(err.code || 401).json({
      error: err.name,
      error_description: err.message,
      details: {
        token: authHeader,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

const revoke = async (req, res) => {
  const refreshToken = req.body.refresh_token;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Missing refresh_token' });
  }

  try {
    const result = await model.revokeToken({ refreshToken }); 
    if (!result) {
      return res.status(400).json({ error: 'Failed to revoke token' });
    }

    res.json({ success: true, message: 'Refresh token revoked' });
  } catch (err) {
    console.error(`[AUTH SERVER] Revoke error: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
};

const handleLogout = async (req, res) => {
  const username = req.session?.user?.username;
  const userId = req.session?.user?.id;
  const redirectUrl = req.query.redirect;

  const clients = await Client.findAll({
    where: { logoutUri: { [Op.not]: null } }
  });

  const allowedOrigins = clients
    .map(c => {
      try { return new URL(c.logoutUri).origin; }
      catch { return null; }
    })
    .filter(Boolean);

  const isAllowed = redirectUrl && allowedOrigins.some(origin =>
    redirectUrl.startsWith(origin)
  );
  const safeRedirect = isAllowed ? redirectUrl : process.env.FRONTEND_URL;

  if (userId) {
    try {
      await Token.destroy({ where: { userId, tokenType: 'oauth2' } });
    } catch (err) {
      console.error(`[AUTH SERVER] Token revoke error: ${err.message}`);
    }
  }

  const logoutUris = clients.map(c => c.logoutUri);

  req.session?.destroy((err) => {
    if (err) {
      console.error(`[AUTH SERVER] Session destroy error:`, err);
      return res.status(500).send('Logout failed');
    }

    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });


    res.redirect(
      `/sso-logout` +
      `?apps=${encodeURIComponent(JSON.stringify(logoutUris))}` +
      `&redirect=${encodeURIComponent(safeRedirect)}`
    );
  });
};

const showSsoLogout = (req, res) => {
  const apps = JSON.parse(decodeURIComponent(req.query.apps || '[]'));
  const redirect = req.query.redirect || process.env.FRONTEND_URL;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Redirecting</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: linear-gradient(to right, #7c3aed, #ec4899);
          font-family: sans-serif;
        }
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .spinner {
          width: 60px;
          height: 60px;
          border: 5px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        p {
          color: white;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .sub {
          color: rgba(255,255,255,0.7);
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="spinner"></div>
        <p>Redirecting to Login page...</p>
        <span class="sub">Please wait while we take you back securely.</span>
      </div>
      <script>
        const apps = ${JSON.stringify(apps)};
        const redirect = ${JSON.stringify(redirect)};
        let cleared = 0;
        const finish = () => {
          window.location.href = redirect;
        };

        if (apps.length === 0) {
          setTimeout(finish, 2000);
        } else {
          const fallbackTimer = setTimeout(finish, 5000);

          apps.forEach(appUrl => {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = appUrl;

            iframe.onload = () => {
              cleared++;

              if (cleared === apps.length) {
                clearTimeout(fallbackTimer);

                setTimeout(() => {
                  finish();
                }, 2000);
              }
            };

        document.body.appendChild(iframe);
      });
    }
      </script>
    </body>
    </html>
  `);
};

const introspectToken = async (req, res) => {
  const token = req.body.token;

  if (!token) {
    return res.status(400).json({ active: false, error: "Missing token" });
  }

  try {
    const accessToken = await model.getAccessToken(token); 

    if (!accessToken || accessToken.accessTokenExpiresAt < new Date()) {
      return res.status(200).json({ active: false });
    }

    return res.status(200).json({
      active: true,
      user_id: accessToken.user?.id,
      client_id: accessToken.client?.id,
      scope: accessToken.scope,
    });
  } catch (err) {
    console.error("Introspection error:", err);
    return res.status(500).json({ active: false, error: "Server error" });
  }
};


module.exports = {
  token,
  validateToken,
  introspectToken,
  revoke, 
  handleLogout,
  showSsoLogout, 
};
