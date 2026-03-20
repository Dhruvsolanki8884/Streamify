import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getStreamToken,
  scheduleMessageDeletion,
} from "../controllers/chat.controllers.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);
router.post("/delete-message", protectRoute, scheduleMessageDeletion);

export default router;
