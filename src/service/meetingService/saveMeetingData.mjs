import  {createZoomMeeting}  from "./zoomMeetingService/zoomApiService/zoomMeetingService.mjs";
import  sequelize  from "../../db/db.js";
import  {saveMeetingParticipants}  from "./saveMeetingParticipants.mjs";
import  {sendMeetingEmail}  from "./sendMeetingEmail.mjs";
import  {createTeamsMeeting}  from "./teamsMeetingService/teamsApiService/teamsMeetingService.mjs";

export const saveMeetingService = async (data) => {
  try {
    let meeting;
    let meetingId;
   if(data.platform == "teams"){
     meeting = await createTeamsMeeting(data.title, data.start_time, data.duration, data.timezone, data.description, data.userId, data.platform, data.companyId);
     meetingId= meeting.join_id;
   }else{
     meeting = await createZoomMeeting(data.title, data.start_time, data.duration, data.timezone, data.description, data.userId, data.platform, data.companyId);
     meetingId = meeting.id;
   }
   if (meeting?.success === false) {
      return meeting;
    }
    if (!meeting?.id || !meeting?.join_url) {
      return {
        success: false,
        code: "MEETING_CREATION_FAILED",
        message: "Failed to create meeting. Please try again."
      };
    }
  await sequelize.query(
  `INSERT INTO meetings (module, title, description, start_time, duration, timezone, platform, meeting_id, join_url,
  start_url, host_id, status, created_by, updated_by, host_email, company_id, host_name, join_id)
   VALUES (:module, :title, :description, :start_time, :duration, :timezone, :platform, :meeting_id, :join_url,
   :start_url, :host_id, :status, :created_by, :updated_by, :host_email, :company_id, :host_name, :join_id)`,
  {
    replacements: {
      module :data.module, title: data.title, description: data.description, start_time: data.start_time,
      duration: data.duration, timezone: data.timezone, platform: data.platform, meeting_id: meeting.id,
      join_url: meeting.join_url, start_url: meeting.start_url, host_id: data.userId, status: data.status,
      created_by: data.userId, updated_by: data.userId, host_email: data.userEmail, company_id: data.companyId,
       host_name: data.hostName, join_id: meetingId
    },
  }
);
 
await saveMeetingParticipants(meeting.id, data.participants, data.userId, data.platform, meeting.join_url, data.start_time, data.duration, data.title);

await sendMeetingEmail(meeting.id, "CREATE");
    return {
      success: true,
      message: "Meeting created successfully",
      data: {
        id: meeting.id,
        join_url: meeting.join_url,
        start_url: meeting.start_url
      }
    };

  } catch (error) {
    console.error("SAVE MEETING ERROR:", error);

    return {
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message || "Failed to Create meeting"
    };
  }
};