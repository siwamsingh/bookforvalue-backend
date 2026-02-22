import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import env from "./config/environment";

const app = express();

// CORS setup using env config
const allowedOrigins = env.CORS_ORIGIN === "*"
  ? ["*"]
  : env.CORS_ORIGIN.split(",");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes
app.get("/", (req, res) => {
  const now = new Date(Date.now()); // or just new Date()
const istTime = now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata'
});
  res.send("Server running. Date - "+istTime);
});

export default app;