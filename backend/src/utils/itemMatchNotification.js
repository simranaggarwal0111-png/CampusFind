import nodemailer from "nodemailer";
import { Item } from "../models/Item.js";
import { ItemMatch } from "../models/ItemMatch.js";
import { User } from "../models/User.js";
import { emailCopy } from "./emailTranslations.js";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

export async function sendItemMatchNotifications(item, matches) {
  if (!matches.length) return [];

  const itemsWithOwners = await Item.find({
    _id: { $in: [item._id, ...matches.map((match) => match._id)] },
  })
    .select("postedBy")
    .lean();
  const ownerIdsByItem = new Map(
    itemsWithOwners.map((matchedItem) => [
      matchedItem._id.toString(),
      matchedItem.postedBy?.toString(),
    ]),
  );
  const reporterId = ownerIdsByItem.get(item._id.toString());
  const matchedOwnerIds = matches
    .map((match) => ownerIdsByItem.get(match._id.toString()))
    .filter(Boolean);
  const users = await User.find({
    _id: { $in: [reporterId, ...matchedOwnerIds].filter(Boolean) },
  })
    .select("_id email preferredLanguage")
    .lean();
  const userEmails = new Map(
    users.map((user) => [user._id.toString(), user.email?.trim().toLowerCase()]),
  );
  const languageByEmail = new Map(
    users.map((user) => [
      user.email?.trim().toLowerCase(),
      user.preferredLanguage === "hi" ? "hi" : "en",
    ]),
  );
  const reporterEmail = reporterId ? userEmails.get(reporterId) : "";
  const recipientsByMatch = matches.map((match) => {
    const matchOwnerId = ownerIdsByItem.get(match._id.toString());
    const matchEmail = matchOwnerId ? userEmails.get(matchOwnerId) : "";
    return {
      match,
      lostItemId: item.type === "Lost" ? item._id : match._id,
      foundItemId: item.type === "Found" ? item._id : match._id,
      recipients: [...new Set([reporterEmail, matchEmail].filter(Boolean))],
    };
  });
  const excludedEmails = [
    ...new Set(recipientsByMatch.flatMap(({ recipients }) => recipients)),
  ];

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      "Item-match notifications were skipped because EMAIL_USER or EMAIL_PASS is not configured.",
    );
    return excludedEmails;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
  });
  const frontendUrl = (
    process.env.FRONTEND_URL || "http://localhost:5173"
  ).replace(/\/+$/, "");

  for (const {
    match,
    lostItemId,
    foundItemId,
    recipients,
  } of recipientsByMatch) {
    let record;
    try {
      record = await ItemMatch.findOneAndUpdate(
        { lostItem: lostItemId, foundItem: foundItemId },
        {
          $max: { matchPercentage: match.matchPercentage },
          $setOnInsert: { lostItem: lostItemId, foundItem: foundItemId },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      record = await ItemMatch.findOne({
        lostItem: lostItemId,
        foundItem: foundItemId,
      });
      if (!record) throw error;
    }

    for (const recipient of recipients) {
      const reservation = await ItemMatch.updateOne(
        {
          _id: record._id,
          notifiedEmails: { $ne: recipient },
          notificationLocks: { $ne: recipient },
        },
        { $addToSet: { notificationLocks: recipient } },
      );
      if (reservation.modifiedCount !== 1) continue;

      const lostTitle = item.type === "Lost" ? item.title : match.title;
      const foundTitle = item.type === "Found" ? item.title : match.title;
      const safeLostTitle = String(lostTitle || "Lost item").replace(/[\r\n]+/g, " ").trim();
      const lostUrl = `${frontendUrl}/items/${encodeURIComponent(lostItemId)}`;
      const foundUrl = `${frontendUrl}/items/${encodeURIComponent(foundItemId)}`;
      const language = languageByEmail.get(recipient) || "en";
      const text = emailCopy(language);

      try {
        await transporter.sendMail({
          from: `"CampusFind Portal" <${process.env.EMAIL_USER}>`,
          to: recipient,
          subject: language === "hi"
            ? `${safeLostTitle} के लिए संभावित मिलान मिला`
            : `Possible match found for ${safeLostTitle}`,
          text: [
            language === "hi"
              ? `CampusFind को ${match.matchPercentage}% संभावित मिलान मिला।`
              : `CampusFind found a ${match.matchPercentage}% possible match.`,
            `${text.lost}: ${lostTitle}`,
            `${text.found}: ${foundTitle}`,
            `${text.viewLost}: ${lostUrl}`,
            `${text.viewFound}: ${foundUrl}`,
            "",
            text.signIn,
          ].join("\n"),
          html: `
            <div lang="${language}" style="max-width:600px;margin:24px auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
              <h1 style="margin:0 0 12px;color:#047857;font-size:22px;">${text.possibleMatch}</h1>
              <p>${text.matchFound} <strong>${match.matchPercentage}%</strong> ${text.betweenReports}</p>
              <p><strong>${text.lost}:</strong> ${escapeHtml(lostTitle)}</p>
              <p><strong>${text.found}:</strong> ${escapeHtml(foundTitle)}</p>
              <p style="margin-top:22px;">
                <a href="${escapeHtml(lostUrl)}" style="display:inline-block;margin-right:8px;padding:11px 16px;border-radius:10px;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;">${text.viewLost}</a>
                <a href="${escapeHtml(foundUrl)}" style="display:inline-block;padding:11px 16px;border-radius:10px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;">${text.viewFound}</a>
              </p>
              <p style="font-size:12px;color:#64748b;">${text.signIn}</p>
            </div>
          `,
        });
      } catch (error) {
        console.error(
          `Item-match notification failed (${error.code || error.name || "unknown error"}).`,
        );
        try {
          await ItemMatch.updateOne(
            { _id: record._id },
            { $pull: { notificationLocks: recipient } },
          );
        } catch (cleanupError) {
          console.error(
            "Could not release the item-match notification reservation:",
            cleanupError.message,
          );
        }
        continue;
      }

      try {
        await ItemMatch.updateOne(
          { _id: record._id },
          {
            $addToSet: { notifiedEmails: recipient },
            $pull: { notificationLocks: recipient },
          },
        );
      } catch (error) {
        console.error(
          "Email was sent, but its item-match delivery status could not be saved:",
          error.message,
        );
      }
    }
  }

  return excludedEmails;
}
