// src/config/environment.ts

import dotenv from "dotenv";

dotenv.config();

export default {
  PORT: Number(process.env.PORT) || 8000,
  TEST: process.env.TEST || "",

  JWT_SECRET: process.env.JWT_SECRET as string,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || "1d",
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "3d",

  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,

  NODE_ENV: process.env.NODE_ENV || "development",

  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "",
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true",
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE || "lax",
  COOKIE_MAX_AGE: Number(process.env.COOKIE_MAX_AGE) || 2592000000,

  DATABASE_URL: process.env.DATABASE_URL as string
};