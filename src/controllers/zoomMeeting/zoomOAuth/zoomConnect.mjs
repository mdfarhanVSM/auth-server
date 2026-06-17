export const connectZoom = (req, res) => {
  const userId = req.query.userId;
  const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&state=${userId}`;

  res.redirect(url);
};