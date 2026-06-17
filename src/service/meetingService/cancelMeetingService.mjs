import axios from "axios";
import  sequelize  from "../../db/db.js";
import  {sendMeetingEmail}  from "./sendMeetingEmail.mjs";
import  {cancelZoomMeeting}  from "./zoomMeetingService/zoomApiService/zoomMeetingService.mjs";
import  {cancelTeamsMeeting} from "./teamsMeetingService/teamsApiService/teamsMeetingService.mjs";


export const cancelMeetingService = async (meetingId, userId, companyId) => {
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
     return {
    success: true,
    message: "Meeting already cancelled",
    data: {
      meeting_id: meeting.meeting_id,
      status: "cancelled"
    }
   };
    }
if(meeting.platform == "teams"){
   await cancelTeamsMeeting(userId, meetingId, meeting.platform, companyId)
}else{
    await cancelZoomMeeting(userId, meetingId, meeting.platform);
}

    // Update DB (soft delete)
    await sequelize.query(
      `UPDATE meetings
       SET status = 'cancelled',
           updated_by = :userId,
           updated_at = GETDATE()
       WHERE meeting_id = :meetingId`,
      {
        replacements: { meetingId, userId }
      }
    );

    await sendMeetingEmail(meetingId, "CANCEL");
    return {
      success: true,
      message: "Meeting cancelled successfully",
      data: {
        meeting_id: meeting.meeting_id,
        status: "cancelled"
      }
    };

  } catch (error) {
    if (error.response) {
      throw new Error(
        `Zoom API Error: ${error.response.data?.message}`
      );
    }
    throw new Error(error.message || "Failed to delete meeting");
  }
};

