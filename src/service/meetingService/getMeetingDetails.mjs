import  sequelize  from "../../db/db.js";

export const getMeetingDetails = async (meetingId) => {
  const rows = await sequelize.query(
    `SELECT 
        m.title, FORMAT(m.start_time, 'yyyy-MM-dd HH:mm:ss') AS start_time, FORMAT(m.previous_start_time, 'yyyy-MM-dd HH:mm:ss') AS previous_start_time, m.duration, m.platform, m.join_url, m.start_url,
        m.host_email, m.host_name, m.join_id, p.participant_name, p.participant_email
     FROM meetings m
     JOIN meeting_participants p 
     ON m.meeting_id = p.meeting_id
     WHERE m.meeting_id = :meetingId`,
    {
      replacements: { meetingId: meetingId.toString() },
      type: sequelize.QueryTypes.SELECT
    }
  );

  if (!rows.length) return null;

  const meeting = {
    title: rows[0].title,
    start_time: rows[0].start_time,
    previous_start_time: rows[0].previous_start_time,
    duration: rows[0].duration,
    platform: rows[0].platform,
    join_url: rows[0].join_url,
    start_url: rows[0].start_url,
    host_email: rows[0].host_email,
    host_name: rows[0].host_name,
    join_id: rows[0].join_id
  };

  const participants = rows.map(r => ({
    name: r.participant_name,
    email: r.participant_email
  }));

  return { meeting, participants };
};