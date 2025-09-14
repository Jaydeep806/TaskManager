import express from "express";
import { googleLogin, verifyOtp } from "../controllers/authController.js";

const router = express.Router();

// @route POST /api/auth/google
router.post("/google", googleLogin);

// @route POST /api/auth/verify
router.post("/verify", verifyOtp);

export default router;
