import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const itemImageDirectory = fileURLToPath(
  new URL("../../uploads/items/", import.meta.url),
);

mkdirSync(itemImageDirectory, { recursive: true });

const allowedTypes = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

const uploader = multer({
  storage: multer.diskStorage({
    destination: itemImageDirectory,
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `item-${randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.get(extension) !== file.mimetype) {
      callback(new Error("Only JPG, PNG, and WebP images are allowed."));
      return;
    }
    callback(null, true);
  },
});

export const uploadItemImage = (req, res, next) => {
  uploader.single("image")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const isTooLarge = error.code === "LIMIT_FILE_SIZE";
      res.status(isTooLarge ? 413 : 400).json({
        message: isTooLarge
          ? "Item image must be 5 MB or smaller."
          : error.message,
      });
      return;
    }

    res.status(400).json({ message: error.message });
  });
};

