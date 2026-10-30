import mongoose from "mongoose";

const recoveryReportSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    finderName: { type: String, required: true, trim: true, maxlength: 100 },
    finderEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    finderPhone: { type: String, default: "", trim: true, maxlength: 25 },
    foundLocation: { type: String, required: true, trim: true, maxlength: 200 },
    foundDate: { type: Date, required: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    imageUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Completed"],
      default: "Pending",
    },
    recoveryDate: { type: Date },
  },
  { timestamps: true },
);

recoveryReportSchema.index({ itemId: 1, finderEmail: 1 }, { unique: true });

export const RecoveryReport = mongoose.model(
  "RecoveryReport",
  recoveryReportSchema,
);
