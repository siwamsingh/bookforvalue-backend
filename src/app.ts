import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import env from "./config/environment";

const app = express();

const allowedOrigins =
  env.CORS_ORIGIN === "*"
    ? ["*"]
    : env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (like Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.set("trust proxy", 1); // IMPORTANT for Render + cookies

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.get("/", (req, res) => {
  const now = new Date();
  const istTime = now.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
  res.send("Server running. Date - " + istTime);
});

export default app;