import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    category: { type: String, required: true },

    type: {
      type: String,
      enum: ["Lost", "Found"],
      required: true,
    },

    location: { type: String, required: true },

    date: { type: String, required: true },

    description: { type: String, required: true },

    color: { type: String, default: "", maxlength: 60 },

    brand: { type: String, default: "", maxlength: 80 },

    contact: { type: String, required: true },

    imageUrl: { type: String, default: "" },

    recoveryToken: { type: String, select: false },
    recoveryTokenCreatedAt: { type: Date },
    recoveryQrCode: { type: String, default: "", select: false },
    recoveryUrl: { type: String, default: "", select: false },
    qrCodeEnabled: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["Active", "Found", "Claimed", "Resolved"],
      default: "Active",
    },

    // Information provided by the person who found the lost item
    foundLocation: {
      type: String,
      default: "",
    },

    foundDate: {
      type: String,
      default: "",
    },

    foundDescription: {
      type: String,
      default: "",
    },

    foundContact: {
      type: String,
      default: "",
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    postedByEmail: {
      type: String,
      default: "",
    },

    // Handover logging
    handoverRecipient: {
      type: String,
      default: "",
    },

    handoverDate: {
      type: Date,
    },

    handoverNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

itemSchema.index({ type: 1, status: 1 });
itemSchema.index({ recoveryToken: 1 }, { unique: true, sparse: true });

export const Item = mongoose.model("Item", itemSchema);