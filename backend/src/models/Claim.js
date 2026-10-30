import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
  {
    // Item the student wants to claim
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },

    // Student details
    studentName: {
      type: String,
      required: true,
      trim: true,
    },

    contact: {
      type: String,
      required: true,
      trim: true,
    },

    studentEmail: {
      type: String,
      default: "",
      trim: true,
    },

    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Details to help verify ownership
    proofDescription: {
      type: String,
      required: true,
      trim: true,
    },

    // Unique verification pass code for physical handover at campus desk
    claimCode: {
      type: String,
      default: () => "CF-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    },

    pickupStation: {
      type: String,
      default: "Campus Security Desk (Building B, Room 102)",
    },

    // Admin will approve or reject the claim
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Resolved"],
      default: "Pending",
    },

    // Handover logging
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

export const Claim = mongoose.model("Claim", claimSchema);
