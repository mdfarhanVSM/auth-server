import  {getMeetingPlatformCredentials}  from "../../getMeetingAppCredentials.mjs";
export const getAuthUrl = async (userId, platform) => {
  const data = await getMeetingPlatformCredentials(userId, platform);
  const params = new URLSearchParams({
    client_id: data.clientId,
    response_type: "code",
    redirect_uri: data.redirectUri,
    response_mode: "query",
    scope: "openid profile offline_access User.Read OnlineMeetings.ReadWrite",
    state: userId
  });

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
};