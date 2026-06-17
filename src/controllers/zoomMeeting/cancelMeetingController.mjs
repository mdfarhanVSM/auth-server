import  {cancelMeetingService}  from "../../service/meetingService/cancelMeetingService.mjs";

export const cancelMeetingController = async (req, res) => {
  try {
    const { meetingId, userId, companyId } = req.body;

    const result = await cancelMeetingService(meetingId, userId, companyId);

    res.status(200).json(result);

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
