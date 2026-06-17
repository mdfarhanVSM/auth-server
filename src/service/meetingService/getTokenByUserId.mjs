
import sequelize  from "../../db/db.js";
import  {refreshTeamsToken}  from "./teamsMeetingService/teamsOauthService/teamsTokenService.mjs";
import  {refreshZoomToken}  from "./zoomMeetingService/zoomOauthService/userTokenService.mjs";
export const getTokenByUserId = async (userId, platform, companyId) => {
  try {
    const [result] = await sequelize.query(
      `SELECT accessToken, refreshToken, accessTokenExpiresAt, createdAt 
       FROM Tokens 
       WHERE userId = :userId
       AND platform = :platform
       AND companyId = :companyId`,
      {
        replacements: { userId, platform, companyId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!result) {
      return null;
    }

    const { accessToken, refreshToken, accessTokenExpiresAt } = result;
      const isExpired = isTokenExpired(accessTokenExpiresAt);
    if (!isExpired) {
      return accessToken;
    }
    let newTokenData;
   if(platform ==="teams"){
      newTokenData =await refreshTeamsToken(refreshToken, userId, platform);
   }else{
      newTokenData = await refreshZoomToken(refreshToken);
   }
    
  const expiresAt = new Date(Date.now() + newTokenData.expires_in * 1000);
  
    await sequelize.query(
      `UPDATE Tokens 
       SET accessToken = :access_token,
           refreshToken = :refresh_token,
           accessTokenExpiresAt = :expires_at,
           updatedAt = :updated_at
       WHERE userId = :userId
       AND platform = :platform
       AND companyId = :company_id`,
      {
        replacements: {
          access_token: newTokenData.access_token,
          refresh_token: newTokenData.refresh_token,
          expires_at: expiresAt,
          updated_at: new Date(),
          userId,
          platform,
          company_id: companyId,
        },
      }
    );
    return newTokenData.access_token;

  } catch (error) {
    console.error("Error in getValidAccessToken:", error.message);
    throw error;
  }
};

const isTokenExpired = (expiresAt) => {
  const buffer = 5 * 60 * 1000;
  return Date.now() >= new Date(expiresAt).getTime() - buffer;
};
