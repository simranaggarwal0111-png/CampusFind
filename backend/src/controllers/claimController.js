import mongoose from "mongoose";
import { Item } from "../models/Item.js";
import { Claim } from "../models/Claim.js";
import { sendClaimNotification } from "../utils/claimNotification.js";

// Student submits a claim
export const createClaim = async (req, res) => {
  try {
    const { itemId, studentName, contact, studentEmail, proofDescription } = req.body;

    if (
      !itemId ||
      !studentName?.trim() ||
      !contact?.trim() ||
      !proofDescription?.trim()
    ) {
      return res.status(400).json({
        message: "Please fill in all claim details.",
      });
    }

    if (!mongoose.isValidObjectId(itemId)) {
      return res.status(400).json({ message: "Invalid item ID." });
    }

    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    const isFoundItem = item.type === "Found";
    const isFoundLostItem = item.type === "Lost" && item.status === "Found";

    if (!isFoundItem && !isFoundLostItem) {
      return res.status(400).json({
        message: "Only found items can be claimed.",
      });
    }

    if (item.status === "Claimed" || item.status === "Resolved") {
      return res.status(400).json({
        message: "This item is no longer available to claim.",
      });
    }

    const existingClaim = await Claim.findOne({
      item: itemId,
      contact: contact.trim(),
      status: "Pending",
    });

    if (existingClaim) {
      return res.status(409).json({
        message: "You already have a pending claim for this item.",
      });
    }

    const claim = await Claim.create({
      item: itemId,
      studentName: studentName.trim(),
      contact: contact.trim(),
      studentEmail: req.user?.email || studentEmail?.trim() || "",
      claimedBy: req.user?._id || undefined,
      proofDescription: proofDescription.trim(),
      status: "Pending",
    });

    const notificationSent = await sendClaimNotification(claim, item);

    return res.status(201).json({
      message: notificationSent
        ? "Claim submitted successfully. The admin has been notified."
        : "Claim submitted successfully, but the admin email could not be sent. Please contact the campus administrator.",
      notificationSent,
      claim,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error submitting claim.",
      error: error.message,
    });
  }
};

// Admin: Get all claims
export const getAllClaims = async (req, res) => {
  try {
    const claims = await Claim.find()
      .populate("item", "title category location date type status imageUrl")
      .populate("claimedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json(claims);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching claims.",
      error: error.message,
    });
  }
};

// User: Get claims submitted by the current user
export const getMyClaims = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const userId = req.user?._id;
    const contact = req.query.contact;

    const queryConditions = [];
    if (userId) queryConditions.push({ claimedBy: userId });
    if (userEmail) queryConditions.push({ studentEmail: userEmail });
    if (contact) queryConditions.push({ contact: contact.trim() });

    if (queryConditions.length === 0) {
      return res.status(200).json([]);
    }

    const claims = await Claim.find({ $or: queryConditions })
      .populate("item")
      .sort({ createdAt: -1 });

    return res.status(200).json(claims);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching user claims.",
      error: error.message,
    });
  }
};

// Look up claim status by ID or Claim Code (for tracking)
export const getClaimStatus = async (req, res) => {
  try {
    const { query } = req.params;

    let claim = null;
    if (mongoose.isValidObjectId(query)) {
      claim = await Claim.findById(query).populate("item");
    }

    if (!claim) {
      claim = await Claim.findOne({
        claimCode: query.trim().toUpperCase(),
      }).populate("item");
    }

    if (!claim) {
      return res.status(404).json({ message: "No claim found with this code or ID." });
    }

    return res.status(200).json(claim);
  } catch (error) {
    return res.status(500).json({
      message: "Error looking up claim.",
      error: error.message,
    });
  }
};

// Admin: Approve or reject a claim
export const updateClaimStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid claim ID." });
    }

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Approved or Rejected.",
      });
    }

    const claim = await Claim.findById(id);

    if (!claim) {
      return res.status(404).json({ message: "Claim not found." });
    }

    if (claim.status !== "Pending") {
      return res.status(400).json({
        message: "This claim has already been reviewed.",
      });
    }

    if (status === "Approved") {
      const item = await Item.findById(claim.item);

      if (!item) {
        return res.status(404).json({
          message: "The item linked to this claim was not found.",
        });
      }

      const isFoundItem = item.type === "Found";
      const isFoundLostItem = item.type === "Lost" && item.status === "Found";

      if (!isFoundItem && !isFoundLostItem) {
        return res.status(400).json({
          message: "Only found items can have approved claims.",
        });
      }

      if (item.status === "Claimed" || item.status === "Resolved") {
        return res.status(409).json({
          message: "This item has already been claimed or resolved.",
        });
      }

      // Mark item as claimed after approval
      item.status = "Claimed";
      await item.save();
    }

    claim.status = status;
    if (notes) claim.handoverNotes = notes.trim();
    if (req.body.pickupStation && req.body.pickupStation.trim()) {
      claim.pickupStation = req.body.pickupStation.trim();
    }
    await claim.save();

    return res.status(200).json({
      message: `Claim ${status.toLowerCase()} successfully.`,
      claim,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating claim.",
      error: error.message,
    });
  }
};

// Admin: Mark an approved item as returned (Handover completion)
export const markItemReturned = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid claim ID." });
    }

    const claim = await Claim.findById(id);

    if (!claim) {
      return res.status(404).json({ message: "Claim not found." });
    }

    if (claim.status !== "Approved") {
      return res.status(400).json({
        message: "Only approved claims can be marked as returned.",
      });
    }

    const item = await Item.findById(claim.item);

    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    const now = new Date();

    // Update item handover status
    item.status = "Resolved";
    item.handoverRecipient = claim.studentName;
    item.handoverDate = now;
    if (notes) item.handoverNotes = notes;
    await item.save();

    // Update claim handover log
    claim.status = "Resolved";
    claim.handoverDate = now;
    claim.handoverNotes = notes || "Physical handover completed at campus desk.";
    await claim.save();

    return res.status(200).json({
      message: "Item handover confirmed and marked as returned successfully.",
      item,
      claim,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error marking item as returned.",
      error: error.message,
    });
  }
};
