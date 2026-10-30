import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import claimRoutes from "./routes/claimRoutes.js";
import recoveryRoutes from "./routes/recoveryRoutes.js";
import { profilePictureDirectory } from "./middleware/profilePictureUpload.js";
import { itemImageDirectory } from "./middleware/itemImageUpload.js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
if (process.env.FRONTEND_URL) {
  const frontendOrigin = new URL(process.env.FRONTEND_URL).origin;
  if (!["http:", "https:"].includes(new URL(frontendOrigin).protocol)) {
    throw new Error("FRONTEND_URL must use HTTP or HTTPS.");
  }
  allowedOrigins.push(frontendOrigin);
}

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));
app.use("/uploads/profile-pictures", express.static(profilePictureDirectory));
app.use("/uploads/items", express.static(itemImageDirectory));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/recovery", recoveryRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "CampusFind Backend API is running" });
});

// Serve frontend in production (Single Service Deployment)
const frontendDistPath = fileURLToPath(new URL("../../frontend/dist", import.meta.url));
if (existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

// Connect DB & Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
