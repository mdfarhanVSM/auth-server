import axios from "axios";
import  {getTokenByUserId}  from "../../getTokenByUserId.mjs";

//zoom meeting creation
export const createZoomMeeting = async (title, start_time, duration, timezone, description, userId, platform, companyId) => {
try {
  
  const access_token = await getTokenByUserId(userId, platform, companyId);
  if(!access_token){
    return {
    success: false,
    code: "NO_TEAMS_CONNECTION",
    message: "Please connect your Zoom account to create a Zoom meeting.",
  };
  }
  const response = await axios.post(
    "https://api.zoom.us/v2/users/me/meetings",
    {
      topic: title,
      type: 2,
      start_time: start_time,
      duration: duration,
      timezone: timezone,
      agenda: description || "",
      settings: {
        join_before_host: false,
        waiting_room: true,
        approval_type: 0,
        enforce_login: true,
        registration_type: 1
      }
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
  console.error(error);
 }
};

// zoom meeting reschedule
export const rescheduleZoomMeeting = async (userId, meetingId, title, startTime,duration, description, platform) =>{
try {
  const token = await getTokenByUserId(userId, platform);

    await axios.patch(
      `https://api.zoom.us/v2/meetings/${meetingId}`,
      {
        topic: title,
        start_time: startTime,
        duration: duration,
        agenda: description
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
} catch (error) {
  console.error(error);
}
};

// zoom meeting cancel
export const cancelZoomMeeting = async (userId, meetingId, platform) =>{
try {
  const token = await getTokenByUserId(userId, platform);

    await axios.delete(
      `https://api.zoom.us/v2/meetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

} catch (error) {
  console.error(error);
}
};


//get zoom meeting reports

export const fetchZoomMeetingReport = async (userId, meetingId, platform) => {

  const token = await getTokenByUserId(userId, platform);
  return await axios.get(
    `https://api.zoom.us/v2/past_meetings/${meetingId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
};