import mongoose from "mongoose";

const itemMatchSchema = new mongoose.Schema(
  {
    lostItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    foundItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    matchPercentage: { type: Number, required: true },
    notifiedEmails: { type: [String], default: [] },
    notificationLocks: { type: [String], default: [] },
  },
  { timestamps: true },
);

itemMatchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });

export const ItemMatch = mongoose.model("ItemMatch", itemMatchSchema);
