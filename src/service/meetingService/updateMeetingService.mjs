import axios from "axios";
import  sequelize  from "../../db/db.js";
import  {sendMeetingEmail}  from "./sendMeetingEmail.mjs";
import  {rescheduleZoomMeeting}  from "./zoomMeetingService/zoomApiService/zoomMeetingService.mjs";
import  {updateTeamsOnlineMeeting}  from "./teamsMeetingService/teamsApiService/teamsMeetingService.mjs";

export const updateMeetingService = async (meetingId, startTime, duration, title, description, userId, platform, companyId) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT * FROM meetings WHERE meeting_id = :meetingId`,
      {
        replacements: { meetingId: meetingId.toString() }
      }
    );

    const meeting = rows[0];

    if (!meeting) {
      throw new Error("Meeting not found");
    }

    if (meeting.status === "cancelled") {
      throw new Error("Cannot update cancelled meeting");
    }
if(platform == "zoom"){
    await rescheduleZoomMeeting(userId, meetingId, title, startTime, duration, description, meeting.platform);
}else{
  const endTime = new Date(new Date(startTime).getTime() + duration * 60000).toISOString();
 await updateTeamsOnlineMeeting(userId, meetingId, platform, title, startTime, endTime, companyId);
}
    await sequelize.query(
      `UPDATE meetings
       SET 
         title = :title, description = :description, previous_start_time = start_time, start_time = :startTime,
         duration = :duration, status = 'rescheduled', updated_by = :userId, updated_at = GETDATE()
         WHERE meeting_id = :meetingId AND platform = :platform`,
      {
        replacements: {
          meetingId: meetingId.toString(), title, description, startTime, duration, userId
        }
      }
    );

     await sendMeetingEmail(meetingId, "RESCHEDULE");
    return {
      success: true,
      message: "Meeting updated successfully",
      data: {
        meeting_id: meeting.meeting_id,
        start_time: startTime,
        duration: duration
      }
    };

  } catch (error) {
    if (error.response) {
      throw new Error(
        `API Error: ${error.response.data?.message}`
      );
    }
    throw new Error(error.message || "Failed to update meeting");
  }
};
