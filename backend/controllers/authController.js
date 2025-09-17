import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js"; // <-- ADD THIS LINE

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

let otpStore = {}; // Temporary OTP store

// Google Login
export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ msg: "Token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, sub: googleId } = ticket.getPayload();
    
    // Check if user already exists
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });
    }

    if (!user) {
      // Create a new user if one doesn't exist
      user = await User.create({ email, name, googleId });
    } else if (!user.googleId) {
      // If user exists but was created via OTP, add the googleId
      user.googleId = googleId;
      await user.save();
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, googleId: googleId, name: name, expiry: Date.now() + 600000 }; // OTP expires in 10 minutes

    // Send OTP via email
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP - Task Reminder",
      text: `Your OTP is ${otp}`,
    });

    res.json({ msg: "OTP sent to email", email });

  } catch (error) {
    console.error("Error during Google Login:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const storedData = otpStore[email];

  if (!storedData || storedData.otp !== otp) {
    return res.status(400).json({ msg: "Invalid OTP" });
  }

  // Find the user and generate a JWT
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // This case should ideally not happen with the new flow
      return res.status(404).json({ msg: "User not found after OTP verification" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    
    // Clear OTP from store
    delete otpStore[email];

    res.json({ msg: "Login successful", token, user: { id: user._id, email: user.email, name: user.name } });

  } catch (error) {
    console.error("Error during OTP verification:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};