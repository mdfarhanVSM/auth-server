import axios from "axios";
import { getMeetingDetails } from "./getMeetingDetails.mjs";
import { formatMeetingDateTime } from "../../utils/formatMeetingDateTime.mjs";
export const sendMeetingEmail = async (meetingId, type) => {
  try {
    const { meeting, participants } =
      await getMeetingDetails(meetingId);
 
    const { date, time } =
      formatMeetingDateTime(meeting.start_time);
 
    let subject = "";
    let template = "";
    let hostTemplate = "";
    let extra = {};
 
    switch (type) {
      case "CREATE":
        subject = `Meeting Invitation - ${meeting.title}`;
        template = "meetingInvite";
        hostTemplate = "meetingHostInvite";
        break;
 
      case "CANCEL":
        subject = "Meeting Cancelled";
        template = "meetingCancel";
        hostTemplate = "meetingCancelHost";
        break;
 
      case "RESCHEDULE":
        subject = "Meeting Rescheduled";
        template = "meetingUpdate";
        hostTemplate = "meetingUpdateHost";
 
        const { date: oldDate, time: oldTime } =
          formatMeetingDateTime(meeting.previous_start_time);
 
        extra = {
          oldDate,
          oldTime,
          newDate: date,
          newTime: time
        };
        break;
    }
    const notification_Url = process.env.notificationUrl;
    await Promise.all(
      participants.map((p) =>
        axios.post(
          `${notification_Url}/api/notifications/send`,
          {
            email: [p.email],
            type:"email",
            ccEmails:"",
            subject,
            templateName: template,
            appId: "meetings",
            variables: {
              name: p.name,
              meetingHost: meeting.host_name,
              meetingId: meeting.join_id,
              title: meeting.title,
              platform: meeting.platform,
              duration: meeting.duration,
              date,
              time,
              joinUrl: meeting.join_url,
              ...extra
            }
          }
        )
      )
    );
 
    await axios.post(
        `${notification_Url}/api/notifications/send`,
      {
        email: [meeting.host_email],
        type:"email",
        ccEmails:"",
        subject,
        templateName: hostTemplate,
        appId: "meetings",
        variables: {
          name: meeting.host_name,
          meetingId: meeting.join_id,
          meetingHost: meeting.host_name,
          title: meeting.title,
          platform: meeting.platform,
          duration: meeting.duration,
          date,
          time,
          startUrl: meeting.start_url,
          ...extra
        }
      }
    );
 
  } catch (error) {
    console.error("Response:", error.response?.data);
    console.error("Email Error:", error);
  }
};