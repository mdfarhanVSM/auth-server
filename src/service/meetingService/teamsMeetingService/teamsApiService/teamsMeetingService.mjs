import axios from "axios";
import  { getTokenByUserId }  from "../../getTokenByUserId.mjs";

export const createTeamsMeeting = async (
  title,
  start_time,
  duration,
  timezone,
  description,
  userId,
  platform,
  companyId
) => {
  try {
    const access_token = await getTokenByUserId(userId, platform, companyId);
    if (!access_token) {
  return handleTeamsError({
    customCode: "NO_TEAMS_CONNECTION"
  });
}

    const start = new Date(start_time);
    const end = new Date(start.getTime() + duration * 60000);

    const response = await axios.post(
      "https://graph.microsoft.com/v1.0/me/onlineMeetings",
      {
        subject: title,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        lobbyBypassSettings: {
          scope: "everyone"
        },
        allowedPresenters: "organization"
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
          Prefer: 'outlook.timezone="UTC"'
        }
      }
    );

    return {
      id: response.data.id,
      join_id: response.data.joinMeetingIdSettings.joinMeetingId,
      join_url: response.data.joinWebUrl,
      start_url: response.data.joinWebUrl,
      start_time: response.data.startDateTime,
      end_time: response.data.endDateTime
    };

  } catch (error) {
    console.error("Teams Error:", error.response?.data || error.message);
  return handleTeamsError(error);
  }
};


//reschedule teams meeting
export const updateTeamsOnlineMeeting = async (userId, meetingId, platform, title, startTime, endTime, companyId) => {
  try {
     const access_token = await getTokenByUserId(userId, platform, companyId);
    const response = await axios.patch(
      `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}`,
     {
       subject: title,
      startDateTime: new Date(startTime).toISOString(),  
        endDateTime: new Date(endTime).toISOString()
     },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data;

  } catch (error) {
    console.error("Update Teams Meeting Error:", error.response?.data || error.message);
    throw error;
  }
};

//delete meeting
export const cancelTeamsMeeting = async (userId, meetingId, platform, companyId) =>{
try {
const access_token = await getTokenByUserId(userId, platform, companyId);

  const response = await axios.delete(
      `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    return {
      success: true,
      message: "Meeting deleted successfully"
    };

} catch (error) {
  console.error("Delete Meeting Error:", error.response?.data);

    return {
      success: false,
      error: error.response?.data
    };
}
};

// teams get meeting attendance

export const fetchTeamsAttendance = async (userId, meetingId, platform, companyId) => {
  try {
const access_token = await getTokenByUserId(userId, platform, companyId);
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}/attendanceReports`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );
    return response;
  } catch (error) {
  console.error("Meeting Report Error:", error.response?.data);
  }
};


//error handling
const handleTeamsError = (error) => {

  if (error?.customCode) {
    switch (error.customCode) {
      case "NO_TEAMS_CONNECTION":
        return {
          success: false,
          code: "NO_TEAMS_CONNECTION",
          message: "Please connect your Microsoft account to create a Teams meeting.",
        };
    }
  }
  const graphError = error.response?.data?.error;
  const code = graphError?.code;

  // Default response
  let response = {
    success: false,
    code: "UNKNOWN_ERROR",
    message: "Unable to create Teams meeting. Please try again.",
  };

  if (code === "AuthenticationError") {
    response = {
      success: false,
      code: "TEAMS_AUTH_OR_LICENSE",
      message: "Unable to create Teams meeting. Please reconnect your Microsoft account or ensure Teams is enabled.",
    };
  }

  if (code === "Forbidden") {
    response = {
      success: false,
      code: "NO_PERMISSION",
      message: "Your account does not have permission or Teams is not enabled.",
    };
  }

  if (code === "BadRequest") {
    response = {
      success: false,
      code: "INVALID_DATA",
      message: "Invalid meeting details provided.",
    };
  }
  return response;
};