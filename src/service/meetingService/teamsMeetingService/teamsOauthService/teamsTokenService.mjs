import axios from "axios";
import  {saveUsersTokenService}  from "../../zoomMeetingService/zoomOauthService/saveUsersToken.mjs";
import  { getMeetingPlatformCredentials } from "../../getMeetingAppCredentials.mjs";
export const teamsTokenCallback = async (code, userId) => {
    try {
    const data = await getMeetingPlatformCredentials(userId, "teams");
  const params = new URLSearchParams();

  params.append("client_id", data.clientId);
  params.append("client_secret", data.clientSecret);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", data.redirectUri);

  const response = await axios.post(
    `https://login.microsoftonline.com/common/oauth2/v2.0/token`,
    params
  );
const { access_token, refresh_token, expires_in } = response.data;
const expiresAt = new Date(Date.now() + expires_in * 1000);

 await saveUsersTokenService(userId, access_token, refresh_token, expiresAt, "teams", data.companyId);
   } catch (error) {
      console.error(error.response?.data || error.message);   
    }
};


//refresh teams token
export const refreshTeamsToken = async (refreshToken, userId, platform) => {
  const data = await getMeetingPlatformCredentials(userId, platform);
  const params = new URLSearchParams();

  params.append("client_id", data.clientId);
  params.append("client_secret", data.clientSecret);
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);
  params.append("scope", "openid profile offline_access User.Read OnlineMeetings.ReadWrite");

  const res = await axios.post(
    `https://login.microsoftonline.com/common/oauth2/v2.0/token`,
    params
  );

  return res.data;
};