import express from "express";
import {
  sendOtp,
  verifyOtpOnly,
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateProfilePicture,
  deleteProfilePicture,
  setupInitialAdmin,
  getAllUsers,
  updateUserRole,
  updatePreferredLanguage,
} from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { uploadProfilePicture } from "../middleware/profilePictureUpload.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpOnly);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", protect, getMe);
router.patch("/language", protect, updatePreferredLanguage);
router.post("/profile-picture", protect, uploadProfilePicture, updateProfilePicture);
router.delete("/profile-picture", protect, deleteProfilePicture);

// Admin setup & user management
router.post("/setup-admin", setupInitialAdmin);
router.get("/users", protect, adminOnly, getAllUsers);
router.patch("/users/:id/role", protect, adminOnly, updateUserRole);

export default router;
