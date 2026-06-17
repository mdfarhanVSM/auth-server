import express from "express";
import multer from "multer";
import  {createMeeting}  from "../controllers/zoomMeeting/zoomMeetingController.mjs";
import  {cancelMeetingController}  from "../controllers/zoomMeeting/cancelMeetingController.mjs";
import {updateMeetingController}  from "../controllers/zoomMeeting/updateMeetingController.mjs";
import  {getMeetingsDetails}  from "../controllers/zoomMeeting/getMeetingsControllers.mjs";
import  {getMeetingAttendanceController}  from "../controllers/zoomMeeting/meetingAttendance.mjs";
import  {connectZoom}  from "../controllers/zoomMeeting/zoomOAuth/zoomConnect.mjs";
import  {zoomCallback}  from "../controllers/zoomMeeting/zoomOAuth/usersTokenController.mjs";
import  {connectTeams}  from "../controllers/zoomMeeting/teamsOAuth/teamsConnect.mjs";
import  {teamsCallback}  from "../controllers/zoomMeeting/teamsOAuth/authTokenController.mjs";
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/createMeeting", createMeeting);
router.delete("/cancelMeeting", cancelMeetingController);
router.patch("/updateMeeting", updateMeetingController);
router.get("/getMeetings", getMeetingsDetails);
router.get("/getMeetingAttendence", getMeetingAttendanceController);
router.get("/connect", connectZoom);
router.get("/callback", zoomCallback);
router.get("/connectTeams", connectTeams);
router.get("/teamsCallback", teamsCallback);
export default router;