import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { Item } from "../models/Item.js";
import { isRecoveryTokenExpired } from "../utils/recoveryToken.js";
import { sendItemReportNotifications } from "../utils/foundItemNotification.js";
import { sendItemMatchNotifications } from "../utils/itemMatchNotification.js";
import { findSimilarItems } from "../utils/itemMatching.js";

export const getItems = async (req, res) => {
  try {
    const { type, search, category, location, status } = req.query;

    const filter = {};

    // Filter by Lost or Found
    if (type) {
      filter.type = {
        $regex: `^${type}$`,
        $options: "i",
      };
    }

    // Filter by status (e.g. Active, Found, Claimed, Resolved)
    if (status) {
      filter.status = {
        $regex: `^${status}$`,
        $options: "i",
      };
    }

    // Search by title or description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category && category !== "All") {
      filter.category = {
        $regex: `^${category}$`,
        $options: "i",
      };
    }

    // Filter by location
    if (location) {
      filter.location = {
        $regex: location,
        $options: "i",
      };
    }

    const itemsQuery = Item.find(filter)
      .select("-recoveryToken -recoveryQrCode -recoveryUrl")
      .sort({ createdAt: -1 });
    if (req.user?.role === "admin") {
      itemsQuery.populate("postedBy", "name email role");
    } else {
      itemsQuery.select("-contact -postedByEmail");
    }
    const items = await itemsQuery;

    res.status(200).json(
      items.map((item) => {
        const itemData = item.toObject();
        const postedById = item.postedBy?._id || item.postedBy;
        itemData.isOwner =
          Boolean(req.user) &&
          postedById?.toString() === req.user._id.toString();
        if (itemData.qrCodeEnabled) {
          itemData.qrCodeEnabled = !isRecoveryTokenExpired(
            item.recoveryTokenCreatedAt,
          );
        }
        delete itemData.recoveryTokenCreatedAt;
        if (req.user?.role !== "admin") {
          delete itemData.postedBy;
        }
        return itemData;
      }),
    );
  } catch (error) {
    res.status(500).json({
      message: "Error fetching items",
      error: error.message,
    });
  }
};

export const createItem = async (req, res) => {
  try {
    const itemData = {
      ...req.body,
    };

    if (req.user) {
      itemData.postedBy = req.user._id;
      itemData.postedByEmail = req.user.email;
    }

    delete itemData.recoveryToken;
    delete itemData.recoveryTokenCreatedAt;
    delete itemData.recoveryQrCode;
    delete itemData.recoveryUrl;
    delete itemData.qrCodeEnabled;

    let recovery;
    if (
      itemData.type === "Lost" &&
      (!itemData.status || itemData.status === "Active") &&
      req.user
    ) {
      const frontendUrl =
        process.env.FRONTEND_URL ||
        (process.env.NODE_ENV === "production"
          ? ""
          : "http://localhost:5173");
      let frontendBaseUrl;
      try {
        const parsedFrontendUrl = new URL(frontendUrl);
        if (!["http:", "https:"].includes(parsedFrontendUrl.protocol)) {
          throw new Error("FRONTEND_URL must use HTTP or HTTPS.");
        }
        frontendBaseUrl = parsedFrontendUrl.toString().replace(/\/+$/, "");
      } catch {
        return res.status(503).json({
          message:
            "Lost-item QR recovery is not configured. Set FRONTEND_URL to your deployed frontend URL.",
        });
      }

      const recoveryToken = randomBytes(32).toString("hex");
      const recoveryUrl = `${frontendBaseUrl}/recover/${recoveryToken}`;
      const recoveryQrCode = await QRCode.toDataURL(recoveryUrl, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 480,
      });
      itemData.recoveryToken = recoveryToken;
      itemData.recoveryTokenCreatedAt = new Date();
      itemData.recoveryQrCode = recoveryQrCode;
      itemData.recoveryUrl = recoveryUrl;
      itemData.qrCodeEnabled = true;
    }

    const item = await Item.create(itemData);
    if (item.qrCodeEnabled) {
      recovery = {
        qrCodeDataUrl: item.recoveryQrCode,
        recoveryUrl: item.recoveryUrl,
      };
    }
    const responseItem = item.toObject();
    delete responseItem.recoveryToken;
    delete responseItem.recoveryTokenCreatedAt;
    delete responseItem.recoveryQrCode;
    delete responseItem.recoveryUrl;

    let matches = [];
    let matchingWarning;

    try {
      matches = await findSimilarItems(item);
    } catch (error) {
      matchingWarning =
        "Your report was saved, but possible matches could not be loaded.";
      console.error("Item matching failed after report creation:", error.message);
    }

    if (
      ["Lost", "Found"].includes(item.type) &&
      (req.user?.email || matches.length > 0)
    ) {
      const reporterEmail = req.user?.email || "";
      setImmediate(async () => {
        let excludedRecipientEmails = [];
        if (matches.length > 0) {
          try {
            excludedRecipientEmails = await sendItemMatchNotifications(item, matches);
          } catch (error) {
            console.error(
              "Item-match notifications could not be sent:",
              error.message,
            );
          }
        }

        if (reporterEmail) {
          try {
            await sendItemReportNotifications(
              item,
              reporterEmail,
              excludedRecipientEmails,
            );
          } catch (error) {
            console.error(
              "Item-report notifications could not be sent:",
              error.message,
            );
          }
        }
      });
    }

    res.status(201).json({
      message: `${item.type} item reported successfully`,
      item: responseItem,
      ...(recovery ? { recovery } : {}),
      matches,
      ...(matchingWarning ? { matchingWarning } : {}),
    });
  } catch (error) {
    const statusCode = error.name === "ValidationError" ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

export const getItemById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await Item.findById(req.params.id).select(
      "-contact -postedByEmail -postedBy -recoveryTokenCreatedAt -qrCodeEnabled",
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getItemMatches = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await Item.findById(req.params.id).select(
      "title type category color brand location date description imageUrl status",
    );
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const matches = await findSimilarItems(item);
    return res.status(200).json({ matches });
  } catch (error) {
    return res.status(500).json({
      message: "Could not load possible item matches.",
      error: error.message,
    });
  }
};

export const getMyItems = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const userId = req.user?._id;
    const contact = req.query.contact;

    const queryConditions = [];
    if (userId) queryConditions.push({ postedBy: userId });
    if (userEmail) queryConditions.push({ postedByEmail: userEmail });
    if (contact) queryConditions.push({ contact: contact.trim() });

    if (queryConditions.length === 0) {
      return res.status(200).json([]);
    }

    const items = await Item.find({ $or: queryConditions }).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getItemRecoveryQr = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID." });
    }

    const item = await Item.findById(req.params.id).select(
      "+recoveryToken +recoveryQrCode +recoveryUrl",
    );
    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    const isOwner =
      item.postedBy?.toString() === req.user?._id?.toString() ||
      (item.postedByEmail &&
        item.postedByEmail.toLowerCase() === req.user?.email?.toLowerCase());
    if (!isOwner) {
      return res.status(403).json({ message: "Not authorized to view this QR code." });
    }
    if (item.qrCodeEnabled && isRecoveryTokenExpired(item.recoveryTokenCreatedAt)) {
      return res.status(410).json({ message: "This recovery QR code has expired." });
    }
    if (
      item.type !== "Lost" ||
      item.status !== "Active" ||
      !item.qrCodeEnabled ||
      !item.recoveryToken ||
      !item.recoveryQrCode
    ) {
      return res.status(410).json({
        message: "QR recovery is unavailable for this item.",
      });
    }

    return res.status(200).json({
      qrCodeDataUrl: item.recoveryQrCode,
      recoveryUrl: item.recoveryUrl,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Check permission: Admin or item owner (by ID or email)
    const isOwner =
      (item.postedBy && item.postedBy.toString() === req.user?._id?.toString()) ||
      (item.postedByEmail && item.postedByEmail.toLowerCase() === req.user?.email?.toLowerCase());

    if (req.user?.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "Not authorized to update this item." });
    }

    const allowedUpdates = [
      "title",
      "category",
      "type",
      "location",
      "date",
      "description",
      "color",
      "brand",
      "contact",
      "imageUrl",
      "status",
      "handoverRecipient",
      "handoverNotes",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    await item.save();

    res.status(200).json({ message: "Item updated successfully", item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Check permission: Admin or item owner (by ID or email)
    const isOwner =
      (item.postedBy && item.postedBy.toString() === req.user?._id?.toString()) ||
      (item.postedByEmail && item.postedByEmail.toLowerCase() === req.user?.email?.toLowerCase());

    if (req.user?.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "Not authorized to delete this item." });
    }

    await Item.findByIdAndDelete(id);
    res.status(200).json({ message: "Item removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reportFoundItem = async (req, res) => {
  try {
    const { foundLocation, foundDate, foundDescription, foundContact } =
      req.body;

    if (
      !foundLocation ||
      !foundDate ||
      !foundDescription ||
      !foundContact
    ) {
      return res.status(400).json({
        message: "All found item details are required",
      });
    }

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        message: "Lost item not found",
      });
    }

    if (item.type !== "Lost") {
      return res.status(400).json({
        message: "This item is not a lost item",
      });
    }

    if (item.status !== "Active") {
      return res.status(400).json({
        message: "This lost item has already been matched or resolved",
      });
    }

    item.status = "Found";

    item.foundLocation = foundLocation;
    item.foundDate = foundDate;
    item.foundDescription = foundDescription;
    item.foundContact = foundContact;

    await item.save();

    res.status(200).json({
      message: "Found report submitted successfully. Handover coordination initiated.",
      item,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};