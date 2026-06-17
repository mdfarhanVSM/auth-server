import axios from "axios";
import  {saveUsersTokenService}  from "./saveUsersToken.mjs";
export const userTokenCallback = async (code, userId, companyId) =>{
    try {
       const response = await axios.post(
      "https://zoom.us/oauth/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.REDIRECT_URI
        },
        auth: {
          username: process.env.CLIENT_ID,
          password: process.env.CLIENT_SECRET
        }
      }
    );
    const { access_token, refresh_token, expires_in } = response.data;

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    await saveUsersTokenService(
      userId,
      access_token,
      refresh_token,
      expiresAt,
      "zoom",
      companyId
    );


  } catch (error) {
    console.error(error.response?.data || error.message);
    }
};

//get refresh token
export const refreshZoomToken = async (refreshToken) => {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await axios.post(
    "https://zoom.us/oauth/token",
    null,
    {
      params: {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      },
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );
  return response.data;
};