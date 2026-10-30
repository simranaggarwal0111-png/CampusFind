import { isValidObjectId } from "mongoose";
import { Item } from "../models/Item.js";
import { RecoveryReport } from "../models/RecoveryReport.js";
import { User } from "../models/User.js";
import { sendRecoveryNotification } from "../utils/recoveryNotification.js";
import { isRecoveryTokenExpired } from "../utils/recoveryToken.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\d.\-\s]{7,25}$/;

function imageType(buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return "image/png";
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return "";
}

export const getRecoverableItem = async (req, res) => {
  try {
    const { token } = req.params;
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(404).json({ message: "This recovery link is invalid." });
    }

    const item = await Item.findOne({ recoveryToken: token })
      .select("title category description imageUrl location date qrCodeEnabled type status recoveryTokenCreatedAt");

    if (!item) {
      return res.status(404).json({ message: "This recovery link is invalid." });
    }
    if (isRecoveryTokenExpired(item.recoveryTokenCreatedAt)) {
      return res.status(410).json({ message: "This recovery link has expired." });
    }
    if (!item.qrCodeEnabled || item.type !== "Lost" || item.status !== "Active") {
      return res.status(410).json({
        message: "This recovery link is no longer active.",
      });
    }

    return res.status(200).json({
      item: {
        title: item.title,
        category: item.category,
        description: item.description,
        imageUrl: item.imageUrl,
        location: item.location,
        date: item.date,
      },
    });
  } catch (error) {
    console.error("Could not validate recovery link:", error.message);
    return res.status(500).json({ message: "Could not validate this recovery link." });
  }
};

export const createRecoveryReport = async (req, res) => {
  try {
    const { token } = req.params;
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(404).json({ message: "This recovery link is invalid." });
    }

    const item = await Item.findOne({ recoveryToken: token }).select(
      "+recoveryToken",
    );
    if (!item) {
      return res.status(404).json({ message: "This recovery link is invalid." });
    }
    if (isRecoveryTokenExpired(item.recoveryTokenCreatedAt)) {
      return res.status(410).json({ message: "This recovery link has expired." });
    }
    if (!item.qrCodeEnabled || item.type !== "Lost" || item.status !== "Active") {
      return res.status(410).json({
        message: "This recovery link is no longer active.",
      });
    }

    const finderName =
      typeof req.body.finderName === "string" ? req.body.finderName.trim() : "";
    const finderEmail =
      typeof req.body.finderEmail === "string"
        ? req.body.finderEmail.trim().toLowerCase()
        : "";
    const finderPhone =
      typeof req.body.finderPhone === "string" ? req.body.finderPhone.trim() : "";
    const foundLocation =
      typeof req.body.foundLocation === "string"
        ? req.body.foundLocation.trim()
        : "";
    const foundDateText =
      typeof req.body.foundDate === "string" ? req.body.foundDate.trim() : "";
    const description =
      typeof req.body.description === "string" ? req.body.description.trim() : "";

    if (
      !finderName ||
      !finderEmail ||
      !foundLocation ||
      !foundDateText ||
      !description
    ) {
      return res.status(400).json({ message: "Complete all required fields." });
    }
    if (finderName.length > 100 || !emailPattern.test(finderEmail) || finderEmail.length > 254) {
      return res.status(400).json({ message: "Enter a valid name and email address." });
    }
    if (finderPhone && !phonePattern.test(finderPhone)) {
      return res.status(400).json({ message: "Enter a valid phone number." });
    }
    if (foundLocation.length > 200 || description.length > 2000) {
      return res.status(400).json({ message: "Some recovery details are too long." });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(foundDateText)) {
      return res.status(400).json({ message: "Enter a valid date found." });
    }
    const foundDate = new Date(`${foundDateText}T00:00:00.000Z`);
    if (
      Number.isNaN(foundDate.getTime()) ||
      foundDate.toISOString().slice(0, 10) !== foundDateText ||
      foundDate.getTime() > Date.now() + 24 * 60 * 60 * 1000
    ) {
      return res.status(400).json({ message: "Enter a valid date found." });
    }

    let imageUrl = "";
    if (req.file) {
      const detectedType = imageType(req.file.buffer);
      if (!detectedType || detectedType !== req.file.mimetype) {
        return res.status(400).json({ message: "The uploaded image is not valid." });
      }
      imageUrl = `data:${detectedType};base64,${req.file.buffer.toString("base64")}`;
    }

    let report;
    try {
      report = await RecoveryReport.create({
        itemId: item._id,
        finderName,
        finderEmail,
        finderPhone,
        foundLocation,
        foundDate,
        description,
        imageUrl,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: "A recovery request from this email has already been submitted for this item.",
        });
      }
      throw error;
    }

    setImmediate(async () => {
      try {
        const owner = item.postedBy
          ? await User.findById(item.postedBy).select("email").lean()
          : null;
        const ownerEmail = owner?.email || item.postedByEmail;
        await sendRecoveryNotification(report, item, ownerEmail);
      } catch (error) {
        console.error("Could not send recovery notification:", error.message);
      }
    });

    return res.status(201).json({
      message: "Recovery details sent to the item's owner.",
      reportId: report._id,
      status: report.status,
    });
  } catch (error) {
    console.error("Could not submit recovery report:", error.message);
    return res.status(500).json({ message: "Could not submit the recovery report." });
  }
};

export const getMyRecoveryReports = async (req, res) => {
  try {
    const ownerConditions = [{ postedBy: req.user._id }];
    if (req.user.email) {
      ownerConditions.push({
        postedByEmail: req.user.email.trim().toLowerCase(),
      });
    }
    const ownerItems = await Item.find({ $or: ownerConditions }).distinct("_id");
    const reports = await RecoveryReport.find({ itemId: { $in: ownerItems } })
      .populate("itemId", "title category type status location date")
      .sort({ createdAt: -1 });
    return res.status(200).json(reports);
  } catch (error) {
    console.error("Could not load recovery requests:", error.message);
    return res.status(500).json({ message: "Could not load recovery requests." });
  }
};

export const updateRecoveryReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = req.body?.status;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid recovery request ID." });
    }
    if (!["Accepted", "Rejected", "Completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid recovery request status." });
    }

    const report = await RecoveryReport.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Recovery request not found." });
    }

    const item = await Item.findById(report.itemId).select(
      "+recoveryToken +recoveryQrCode +recoveryUrl",
    );
    if (!item) {
      return res.status(404).json({ message: "The reported item was not found." });
    }
    const isOwner =
      item.postedBy?.toString() === req.user._id.toString() ||
      (item.postedByEmail &&
        item.postedByEmail.toLowerCase() === req.user.email?.toLowerCase());
    if (!isOwner) {
      return res.status(403).json({ message: "Not authorized to manage this request." });
    }

    const validTransition =
      (report.status === "Pending" && ["Accepted", "Rejected"].includes(status)) ||
      (report.status === "Accepted" && status === "Completed");
    if (!validTransition) {
      return res.status(409).json({
        message: `Cannot change a ${report.status.toLowerCase()} request to ${status.toLowerCase()}.`,
      });
    }

    if (status === "Completed") {
      if (item.status === "Resolved") {
        return res.status(409).json({ message: "This item is already resolved." });
      }
      const completedReport = await RecoveryReport.findOneAndUpdate(
        { _id: report._id, status: "Accepted" },
        { $set: { status: "Completed", recoveryDate: new Date() } },
        { new: true, runValidators: true },
      );
      if (!completedReport) {
        return res.status(409).json({
          message: "This recovery request has already been updated.",
        });
      }

      let itemUpdate;
      try {
        itemUpdate = await Item.updateOne(
          { _id: item._id, status: { $ne: "Resolved" } },
          {
            $set: {
              status: "Resolved",
              qrCodeEnabled: false,
              recoveryQrCode: "",
              recoveryUrl: "",
            },
            $unset: {
              recoveryToken: "",
              recoveryTokenCreatedAt: "",
            },
          },
        );
      } catch (error) {
        try {
          await RecoveryReport.updateOne(
            { _id: report._id, status: "Completed" },
            {
              $set: { status: "Accepted" },
              $unset: { recoveryDate: "" },
            },
          );
        } catch (rollbackError) {
          console.error(
            "Could not restore a recovery report after item update failure:",
            rollbackError.message,
          );
        }
        return res.status(500).json({ message: "Could not complete the item recovery." });
      }
      if (itemUpdate.modifiedCount !== 1) {
        try {
          await RecoveryReport.updateOne(
            { _id: report._id, status: "Completed" },
            { $set: { status: "Accepted" }, $unset: { recoveryDate: "" } },
          );
        } catch (rollbackError) {
          console.error(
            "Could not restore a recovery report after item status conflict:",
            rollbackError.message,
          );
          return res.status(500).json({
            message: "Could not complete the item recovery. Please contact support.",
          });
        }
        return res.status(409).json({ message: "This item is already resolved." });
      }
      report.status = completedReport.status;
      report.recoveryDate = completedReport.recoveryDate;
    } else {
      const updatedReport = await RecoveryReport.findOneAndUpdate(
        { _id: report._id, status: "Pending" },
        { $set: { status } },
        { new: true, runValidators: true },
      );
      if (!updatedReport) {
        return res.status(409).json({
          message: "This recovery request has already been updated.",
        });
      }
      report.status = updatedReport.status;
    }

    return res.status(200).json({
      message: `Recovery request ${status.toLowerCase()}.`,
      report,
    });
  } catch (error) {
    console.error("Could not update recovery request:", error.message);
    return res.status(500).json({ message: "Could not update the recovery request." });
  }
};
