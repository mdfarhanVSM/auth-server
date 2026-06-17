import {getMeetingAttendanceService} from "../../service/meetingService/getMeetingAttendance.mjs";

export const getMeetingAttendanceController = async (req, res) => {
  try {
    const { meetingId, userId, platform, companyId } = req.query;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        message: "Meeting ID is required"
      });
    }
    const result = await getMeetingAttendanceService(meetingId, userId, platform, companyId);

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get meeting logs"
    });
  }
};