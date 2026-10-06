import express from "express";

import {
  login,
  logout,
  onboard,
  signup,
} from "../controller/authController.js";

import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// AUTH ROUTES
// ==========================================

// Signup
router.post("/signup", signup);

// Login
router.post("/login", login);

// Logout
router.post("/logout", logout);

// Onboarding
router.post("/onboarding", protectRoute, onboard);

// Get currently logged-in user
router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

export default router;