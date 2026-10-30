import express from "express";
import {
  createClaim,
  getAllClaims,
  getMyClaims,
  getClaimStatus,
  updateClaimStatus,
  markItemReturned,
} from "../controllers/claimController.js";

import {
  protect,
  adminOnly,
  optionalProtect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Students can submit claims (with optional auth attached)
router.post("/", optionalProtect, createClaim);

// Student/User can fetch their own claims
router.get("/my-claims", protect, getMyClaims);

// Track claim status by ID or Claim Code
router.get("/track/:query", getClaimStatus);

// Only logged-in admins can manage all claims
router.get("/", protect, adminOnly, getAllClaims);
router.patch("/:id/status", protect, adminOnly, updateClaimStatus);
router.patch("/:id/returned", protect, adminOnly, markItemReturned);

export default router;
