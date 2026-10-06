import express from "express";
import {
  login,
  logout,
  onboard,
  signup,
  forgotPassword,
  resetPassword,
} from "../controller/authController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup );

router.post("/login", login);


router.post("/logout", logout);

router.post("/onboarding", protectRoute, onboard);
// forget password
// send-reset-password-email
// check if user is logged in and return user data
router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// ==========================================
// PASSWORD RECOVERY
// ==========================================

// User submits their email
router.post(
  "/forgot-password",
  forgotPassword
);

// User submits new password using reset token
router.post(
  "/reset-password/:token",
  resetPassword
);
export default router;