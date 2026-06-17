import axios from "axios";
import  {userTokenCallback}  from "../../../service/meetingService/zoomMeetingService/zoomOauthService/userTokenService.mjs";
import {getMeetingPlatformCredentials}  from "../../../service/meetingService/getMeetingAppCredentials.mjs";
export const zoomCallback = async (req, res) => {
  try {
    const code = req.query.code;
    const userId = req.query.state;

    const data = await getMeetingPlatformCredentials(userId, "teams")
    const response = await userTokenCallback(code, userId, data.company_id);

    res.send(`
      <html>
        <head>
          <title>Zoom Connected</title>
        </head>
        <body style="font-family: Arial; text-align:center; margin-top:50px;">
          <h2 style="color:green;">Zoom Connected Successfully</h2>
          <p>You can close this window.</p>
        </body>
      </html>
    `);

  } catch (error) {
    console.error("Zoom Error:", error.response?.data || error.message);
    res.send(`
      <html>
        <body style="text-align:center; margin-top:50px;">
          <h2 style="color:red;">Failed to connect Zoom</h2>
        </body>
      </html>
    `);
  }
};