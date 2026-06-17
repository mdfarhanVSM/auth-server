import  sequelize  from "../../db/db.js";
import  {QueryTypes}  from "sequelize";
export const getActiveMeetings = async (userId, companyId, userEmail, doctorId, platform) => {
  try {

    await sequelize.query(
            `UPDATE meetings
            SET status = 'completed'
            WHERE 
            host_id = :userId AND
            company_id = :companyId AND
            status NOT IN ('cancelled', 'completed')
            AND DATEADD(MINUTE, duration, start_time) < GETDATE()`,
         {
          replacements:{userId, userEmail, companyId }
         });

const tokenResult = await sequelize.query(
  `
  SELECT
    CASE
      WHEN accessToken IS NOT NULL THEN 1
      ELSE 0
    END AS is_connected
  FROM Tokens
  WHERE userId = :userId
    AND companyId = :companyId
    AND platform = :platform
  `,
  {
    replacements: {
      userId,
      companyId,
      platform,
    },
    type: QueryTypes.SELECT,
  }
)

const meetings = await sequelize.query(
  `
  SELECT  m.title, m.description, FORMAT(m.start_time, 'yyyy-MM-dd HH:mm:ss') AS start_time, m.duration,
      m.platform, m.start_url, m.status, m.meeting_id, m.host_name, m.join_id
  FROM meetings m
  INNER JOIN meeting_participants mp
      ON mp.meeting_id = m.meeting_id
  WHERE m.host_id = :userId
      AND m.company_id = :companyId
      AND m.platform = :platform
      AND m.status != 'cancelled'
      AND mp.doctor_id = :doctorId
  ORDER BY m.start_time DESC
  `,
  {
    replacements: {
      userId,
      companyId,
      platform,
      doctorId,
    },
    type: QueryTypes.SELECT,
  }
)

const upcoming = [];
const completed = [];

meetings.forEach(m => {
  if (m.status === "completed") {
    completed.push(m);
  } else {
    upcoming.push(m);
  }
});

return {
  success: true,
 isConnected: tokenResult.length > 0
  ? tokenResult[0].is_connected === 1
  : false,
  data: {
    upcoming,
    completed
  }
};
  } catch (error) {

    throw new Error("Failed to get meetings details");
  }
}