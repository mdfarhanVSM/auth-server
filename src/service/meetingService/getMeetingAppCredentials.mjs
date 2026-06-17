import  sequelize  from "../../db/db.js"

export const getMeetingPlatformCredentials = async (
  userId,
  platform
) => {
  try {
    const [data] = await sequelize.query(
      `
      SELECT TOP 1
        mpc.companyId,
        mpc.companyName,
        mpc.clientId,
        mpc.clientSecret,
        mpc.tenantId,
        mpc.redirectUri
      FROM Clients mpc
      INNER JOIN EMPLOYEES e
        ON e.COMPANY_ID = mpc.companyId
      WHERE e.EMPLOYEE_ID = :userId
        AND mpc.platform = :platform
        AND mpc.isActive = 1
      `,
      {
        replacements: {
          userId,
          platform
        },
        type: sequelize.QueryTypes.SELECT
      }
    )

    return data || null
  } catch (error) {
    console.error("Error fetching platform credentials:", error)
    throw error
  }
}