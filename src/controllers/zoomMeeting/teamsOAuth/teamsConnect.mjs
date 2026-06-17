import  {getAuthUrl}  from "../../../service/meetingService/teamsMeetingService/teamsOauthService/getTeamsAuthUrl.mjs";
export const connectTeams = async (req, res) => {
  const { userId, platform } = req.query;
  res.redirect(await getAuthUrl(userId, platform));
};