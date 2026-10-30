import express from "express";
import {
  getItems,
  createItem,
  getItemById,
  getItemMatches,
  getMyItems,
  updateItem,
  deleteItem,
  reportFoundItem,
  getItemRecoveryQr,
} from "../controllers/itemController.js";
import {
  createRecoveryReport,
  getRecoverableItem,
} from "../controllers/recoveryController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import { uploadRecoveryImage } from "../middleware/recoveryImageUpload.js";
import { uploadItemImage } from "../middleware/itemImageUpload.js";
import { recoveryRateLimit } from "../middleware/recoveryRateLimit.js";

const router = express.Router();

router.get("/", optionalProtect, getItems);
router.post("/upload-image", optionalProtect, uploadItemImage, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file provided." });
  }
  return res.status(200).json({
    imageUrl: `/uploads/items/${req.file.filename}`,
  });
});
router.post("/", optionalProtect, createItem);
router.get("/recover/:token", getRecoverableItem);
router.post(
  "/recover/:token",
  recoveryRateLimit,
  uploadRecoveryImage,
  createRecoveryReport,
);
router.get("/my-items", protect, getMyItems);
router.get("/:id/recovery-qr", protect, getItemRecoveryQr);
router.get("/:id/matches", protect, getItemMatches);
router.get("/:id", getItemById);
router.patch("/:id", protect, updateItem);
router.delete("/:id", protect, deleteItem);
router.post("/:id/found", reportFoundItem);

export default router;