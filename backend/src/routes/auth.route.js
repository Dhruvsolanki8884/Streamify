import express from "express";
import {
  signup,
  login,
  logout,
  onboard,
  checkEmail,
  resetPassword,
} from "../controllers/auth.controllers.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/check-email", checkEmail);
router.post("/reset-password", resetPassword);

router.post("/onboarding", protectRoute, onboard);

router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

export default router;
