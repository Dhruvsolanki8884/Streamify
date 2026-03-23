import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";

import { connectDB } from "./lib/db.js";
import { ensureReadEventsEnabled } from "./lib/stream.js";

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://streamify-ten-orcin.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      // Allow exact matches
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow ALL Vercel preview deployments (*.vercel.app)
      if (/^https:\/\/[a-zA-Z0-9-]+-[a-zA-Z0-9-]+-[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)) return callback(null, true);
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);
      // Allow Render internal URLs
      if (/^https:\/\/.*\.onrender\.com$/.test(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// Explicitly handle OPTIONS preflight for all routes
app.options("*", cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);
    if (/^https:\/\/.*\.onrender\.com$/.test(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Health check endpoint (used by keep-alive ping)
app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectDB();
  await ensureReadEventsEnabled();

  // Keep-alive: ping self every 14 minutes to prevent Render free tier sleep
  if (process.env.NODE_ENV === "production") {
    const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `https://streamify-ujh1.onrender.com`;
    setInterval(async () => {
      try {
        await fetch(`${RENDER_URL}/api/health`);
        console.log("Keep-alive ping sent");
      } catch (err) {
        console.log("Keep-alive ping failed:", err.message);
      }
    }, 14 * 60 * 1000); // every 14 minutes
  }
});
