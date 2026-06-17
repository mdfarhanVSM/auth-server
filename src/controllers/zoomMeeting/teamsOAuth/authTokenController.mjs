import  {teamsTokenCallback}  from "../../../service/meetingService/teamsMeetingService/teamsOauthService/teamsTokenService.mjs";
export const teamsCallback = async (req, res) => {
  try {
    const code = req.query.code;
    const userId = req.query.state;
    
    const response = await teamsTokenCallback(code, userId);

   res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Teams Connected</title>

  <style>
    body {
      font-family: Arial;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: #f5f5f5;
      margin: 0;
    }

    .card {
      background: white;
      padding: 30px 40px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center;
    }

    h2 {
      color: #16a34a;
      margin-bottom: 15px;
    }

    .loading {
      font-size: 16px;
      color: #555;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
    }

    .dot {
      animation: blink 1.4s infinite;
      font-weight: bold;
      font-size: 20px;
    }

    .dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .dot:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes blink {
      0% {
        opacity: 0.2;
      }

      20% {
        opacity: 1;
      }

      100% {
        opacity: 0.2;
      }
    }
  </style>
</head>

<body>

  <div class="card">
    <h2>
      Teams connected successfully
    </h2>

    <div class="loading">
      Returning to application
      <span class="dot">.</span>
      <span class="dot">.</span>
      <span class="dot">.</span>
    </div>
  </div>

  <script>
    setTimeout(() => {

      if (window.opener) {
        window.opener.postMessage(
          "teams-connected",
          "*"
        );
        window.opener.focus();
      }
      window.close();
    }, 5000);
  </script>
</body>
</html>
`);

  } catch (error) {
    console.error("Teams Error:", error.response?.data || error.message);
    res.send(`
      <html>
        <body style="text-align:center; margin-top:50px;">
          <h2 style="color:red;">Failed to connect Teams</h2>
        </body>
      </html>
    `);
  }
};