import  {saveMeetingService}  from "../../service/meetingService/saveMeetingData.mjs";

export const createMeeting = async (req, res) => {
  try {
    const data = req.body;

    const meeting = await saveMeetingService(data);
    if (meeting.success === false) {
      return res.status(200).json(meeting);
    }

    return res.status(200).json({
      success: true,
      message: meeting.message,
      data: {
        meeting_id: meeting.data?.id,
        join_url: meeting.data?.join_url,
        start_url: meeting.data?.start_url
      }
    });

  } catch (error) {
    console.error(error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message || "Something went wrong"
    });
  }
};