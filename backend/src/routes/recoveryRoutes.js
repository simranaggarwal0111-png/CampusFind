import express from "express";
import {
  getMyRecoveryReports,
  updateRecoveryReportStatus,
} from "../controllers/recoveryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-reports", protect, getMyRecoveryReports);
router.patch("/:id/status", protect, updateRecoveryReportStatus);

export default router;
