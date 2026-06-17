import  sequelize  from "../../db/db.js";

export const saveMeetingReports = async ( userId, meetingId, zoomUuid, topic, hostId, hostName, hostEmail, startTime, endTime, duration, participantsCount, status, platform, companyId ) => {
  try {
  await sequelize.query(
  `INSERT INTO meeting_reports (user_id, meeting_id, zoom_uuid, topic, host_id, host_name, host_email, start_time, end_time, duration,  participants_count, status, platform, company_id)
   VALUES (:user_id, :meeting_id, :zoom_uuid, :topic, :host_id, :host_name, :host_email, :start_time, :end_time, :duration, :participants_count, :status, :platform, :company_id )`,
  {
    replacements: {
      user_id :userId, meeting_id: meetingId, zoom_uuid: zoomUuid, topic: topic,
      host_id: hostId, host_name: hostName, host_email: hostEmail, start_time: startTime,
      end_time: endTime, duration: duration, participants_count: participantsCount, status: status, platform: platform, company_id: companyId
    },
  }
);
    } catch (error) {
        console.error("Error in insert ",error);
    }
}


export const getMeetingReports = async (userId, meetingId, platform, companyId) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT topic, 
              FORMAT(m.start_time, 'yyyy-MM-dd HH:mm:ss') AS start_time, 
              FORMAT(m.end_time, 'yyyy-MM-dd HH:mm:ss') AS end_time, 
              duration, 
              participants_count,
              status,
              platform              
       FROM meeting_reports m
       WHERE user_id = :userId 
       AND meeting_id = :meetingId 
       AND platform = :platform
       AND company_id = :companyId`,
      {
        replacements: { userId, meetingId: meetingId.toString(), platform, companyId },
      }
    );
   
    if (rows.length > 0) {
      return rows[0];
    } else { 
      return null;
    }
  } catch (error) {
    console.error("Error in getMeetingReports:", error.message);
    throw error;
  }
};