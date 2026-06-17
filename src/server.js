// require('dotenv').config();
require("dotenv").config({ path: __dirname + "/../.env" });
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const OAuth2Server = require("oauth2-server");
const sequelize = require("./db/db.js/index.js");
const model = require("./models/oauthModel");
const authRoutes = require("./routes/authRoutes");
const meetingRoutes = require("./routes/meetingRoutes.js").default;
const app = express();
const path = require("path");
const PORT = process.env.PORT || 3001;
app.use(express.static(path.resolve(__dirname, "../public")));

// app.use(cors({
//   origin: 'http://localhost:5173',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
// }));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 60 * 1000,
    },
  }),
);
//hello
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 500,
  message: {
    error: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/oauth/token", authLimiter);
app.use("/validate-token", authLimiter);

const oauth = new OAuth2Server({
  model: model,
  accessTokenLifetime: 60 * 60 * 24,
  // accessTokenLifetime: 3 * 60  ,
  refreshTokenLifetime: 60 * 60 * 24 * 180,
  //  refreshTokenLifetime:  60 * 60 * 24,
  allowBearerTokensInQueryString: true,
  alwaysIssueNewRefreshToken: true,
});

app.locals.oauth = oauth;

app.use("/", authRoutes);
app.use("/api/meetings", meetingRoutes);

(async () => {
  try {
    await sequelize.authenticate();
    app.listen(PORT, () => {});
  } catch (err) {
    console.error("DB connection failed:", err.message);
  }
})();
