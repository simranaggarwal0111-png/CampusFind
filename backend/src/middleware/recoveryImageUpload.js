import multer from "multer";
import path from "node:path";

const allowedTypes = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, fields: 6, fieldSize: 4096 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.get(extension) !== file.mimetype) {
      callback(new Error("Only JPG, PNG, and WebP images are allowed."));
      return;
    }
    callback(null, true);
  },
});

export const uploadRecoveryImage = (req, res, next) => {
  uploader.single("image")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const isTooLarge = error.code === "LIMIT_FILE_SIZE";
      res.status(isTooLarge ? 413 : 400).json({
        message: isTooLarge
          ? "Recovery images must be 2 MB or smaller."
          : error.message,
      });
      return;
    }

    res.status(400).json({ message: error.message });
  });
};
