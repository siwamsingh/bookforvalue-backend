import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import environment from "../config/environment";
import prisma from "../config/db";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      username,
      email,
      phone_number,
      password
    } = req.body;

    if (!username || !email || !phone_number || !password) {
      return res.status(400).json({
        success: false,
        message: "username, email, phone_number and password are required"
      });
    }

    // check phone
    const existingPhone = await prisma.user.findUnique({
      where: { phone_number }
    });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "Phone number already registered"
      });
    }

    // check email
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        phone_number,
        password: hashedPassword
      }
    });

    const { password: _, ...userData } = newUser;

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userData
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};  

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // 1️⃣ Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // 2️⃣ Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // 3️⃣ Generate tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      environment.JWT_ACCESS_SECRET as string,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id
      },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: "7d" }
    );

    // 4️⃣ Save refresh token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refresh_token: refreshToken,
        last_login_time: new Date()
      }
    });

    // 5️⃣ Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false, // true in production (HTTPS)
      sameSite: "lax",
      maxAge: 15 * 60 * 1000
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // 6️⃣ Send response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string
    ) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    return res.json(user);
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.json({
    success: true,
    message: "Logged out successfully"
  });
};