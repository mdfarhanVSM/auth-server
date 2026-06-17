import  sequelize  from "../../../../db/db.js";

export const saveUsersTokenService = async (
  userId,
  accessToken,
  refreshToken,
  expiresAt,
  platform,
  companyId
) => {
  try {

    await sequelize.query(
      `
      IF EXISTS (SELECT 1 FROM Tokens WHERE userId = :user_id AND platform = :platform AND companyId = :company_id)
      BEGIN
        UPDATE Tokens
        SET 
          accessToken = :access_token,
          refreshToken = :refresh_token,
          accessTokenExpiresAt = :expires_at,
          updatedAt = GETDATE()
        WHERE userId = :user_id
        AND platform = :platform
        AND companyId = :company_id
      END
      ELSE
      BEGIN
        INSERT INTO Tokens 
        (userId, accessToken, refreshToken, createdAt, updatedAt, accessTokenExpiresAt, platform, companyId)
        VALUES (:user_id, :access_token, :refresh_token, GETDATE(), GETDATE(), :expires_at, :platform, :company_id)
      END
      `,
      {
        replacements: {
          user_id: userId,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          platform: platform,
          company_id: companyId
        }
      }
    );

    return {
      message: "Zoom token saved/updated successfully"
    };

  } catch (error) {
    throw new Error(error.message || "Failed to store Zoom token");
  }
};