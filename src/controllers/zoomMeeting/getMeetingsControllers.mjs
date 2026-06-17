import { getActiveMeetings } from "../../service/meetingService/getMeetingsService.mjs";

export const getMeetingsDetails = async (req, res) =>{
  try {
        const {userId, companyId, userEmail, doctorId, platform} = req.query;
        const result = await getActiveMeetings(userId, companyId, userEmail, doctorId, platform);

        res.status(200).json(result);
  
      } catch (error) {
    
    res.status(400).json({
        success: false,
        message: error.message
    });
  }
}