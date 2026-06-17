import  sequelize  from "../../db/db.js";
export const saveMeetingParticipants = async (meetingId, participants, userId, platform) =>{

try {
    for(const p of participants) {
      await sequelize.query(
        `INSERT INTO meeting_participants (meeting_id, participant_name, participant_email, platform, created_by, doctor_id)
         VALUES (:meeting_id, :participant_name, :participant_email, :platform, :created_by, :doctor_id)`,
         {
           replacements: {
           meeting_id: meetingId, participant_name: p.name, participant_email: p.email, platform: platform,
           created_by: userId, doctor_id: p.doctor_id
           },
         }
      );
    }

} catch (error) {
    console.error(error.message);
}
}