import  {fetchZoomMeetingReport}  from "./zoomMeetingService/zoomApiService/zoomMeetingService.mjs";
import  {fetchTeamsAttendance}  from "./teamsMeetingService/teamsApiService/teamsMeetingService.mjs";
import { getMeetingReports, saveMeetingReports } from "./getMeetingReports.mjs";

const toIST = (utcDate) => {
  const date = new Date(utcDate);

  const istOffset = 5.5 * 60 * 60 * 1000;

  return new Date(date.getTime() + istOffset);
};

const getDuration = (start, end) => {
  if (!start || !end) return 0;
  return Math.floor((end - start) / 60000);
};

export const getMeetingAttendanceService = async (meetingId, userId, platform, companyId) => {
  try {

    // 1. Check DB
    const reportData = await getMeetingReports(userId, meetingId, platform, companyId);
    if (reportData) {
      return {
        success: true,
        meeting_id: reportData.join_id,
        data: {
          platform: reportData.platform,
          topic: reportData.topic,
          start_time: reportData.start_time,
          end_time: reportData.end_time,
          duration: reportData.duration,
          participants_count: reportData.participants_count,
          status: reportData.status
        }
      };
    }

    let data;

    try {

      if (platform === "zoom") {

        const response = await fetchZoomMeetingReport(userId, meetingId, platform);
        data = response.data;

        await saveMeetingReports( userId, meetingId, data.uuid, data.topic, data.host_id, data.user_name, data.user_email, data.start_time, data.end_time, data.duration, data.participants_count, "completed", platform, companyId );

      }

      else if (platform === "teams") {

        const response = await fetchTeamsAttendance(userId, meetingId, platform, companyId);

        const reports = response.data.value;

        // if (!reports || reports.length === 0) {
        //   return ("meeting expired");
        // }

       
        const report = reports[0];

        const startIST = report?.meetingStartDateTime ? toIST(report?.meetingStartDateTime) : null;
        const endIST = report?.meetingEndDateTime ? toIST(report?.meetingEndDateTime) : null;
      
        const duration = getDuration(startIST, endIST);

        
        data = {
          topic: "Teams Meeting",
          start_time: startIST,
          end_time: endIST,
          duration: duration,
          participants_count: report?.totalParticipantCount,
          status: "completed"
        };

      
        await saveMeetingReports(
          userId,
          meetingId,
          null,
          "Teams Meeting",
          null,
          null,
          null,
          startIST ?? null,
          endIST ?? null,
          duration ?? null,
          report?.totalParticipantCount || null,
          report? "completed" : "missed",
          platform,
          companyId
        );

      } else {
        throw new Error("Invalid platform");
      }

     
      return {
        success: true,
        meeting_id: meetingId,
        status: "completed",
        data: {
          topic: data.topic || "Teams Meeting",
          start_time: data.start_time,
          end_time: data.end_time,
          duration: data.duration || 0,
          participants_count: data.participants_count || 0,
          status: data.status,
        }
      };

    } catch (error) {

     
      if (platform === "zoom" && error.response?.data?.code === 3001) {

        await saveMeetingReports(
          userId, meetingId,
          null, null, null, null, null,
          null, null, null, null,
          "expired",
          platform
        );

        return {
          success: true,
          meeting_id: meetingId,
          status: "expired",
          data: null
        };
      }

      throw error;
    }

  } catch (error) {
    console.error(error.message);
    throw new Error("Failed to fetch meeting report");
  }
};