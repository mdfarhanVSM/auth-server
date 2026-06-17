import  {updateMeetingService}  from "../../service/meetingService/updateMeetingService.mjs";

export const updateMeetingController = async (req, res) =>{
 try {
    const { meetingId, startTime, duration, title, description, userId, platform, companyId} =req.body;

   const result = await updateMeetingService(meetingId, startTime, duration, title, description, userId, platform, companyId);
    res.status(200).json(result);

 } catch (error) {
    res.status(400).json({
        success:false,
        message: error.message
    });
 }
};
