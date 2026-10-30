import nodemailer from "nodemailer";
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

function getEmailImage(imageUrl, itemId) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(
    imageUrl || "",
  );
  if (match) {
    const mimeType = match[1].toLowerCase();
    const content = Buffer.from(match[2], "base64");
    if (content.length > 3 * 1024 * 1024) return null;

    const extension = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    }[mimeType];

    if (!extension) return null;

    return {
      content,
      contentType: mimeType,
      cid: `found-item-${itemId || "item"}@campusfind`,
      filename: `found-item.${extension}`,
    };
  }

  try {
    const url = new URL(imageUrl);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return { url: url.href };
  } catch {
    return null;
  }
}

export async function sendItemReportNotifications(
  item,
  reporterEmail = "",
  excludedRecipientEmails = [],
) {
  if (!item || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      "Found-item notifications were skipped because the item payload or email credentials are incomplete.",
    );
    return;
  }

  const normalizedReporterEmail = String(reporterEmail || "").trim().toLowerCase();
  const excludedEmails = [
    normalizedReporterEmail,
    ...excludedRecipientEmails.map((email) => String(email).trim().toLowerCase()),
  ].filter(Boolean);
  const users = await User.find({
    email: { $nin: excludedEmails },
  })
    .select("email preferredLanguage")
    .lean();
  const recipients = [
    ...new Set(
      users
        .map((user) => user.email?.trim().toLowerCase())
        .filter((email) => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
    ),
  ];
  const languageByEmail = new Map(
    users.map((user) => [
      user.email?.trim().toLowerCase(),
      user.preferredLanguage === "hi" ? "hi" : "en",
    ]),
  );

  if (recipients.length === 0) {
    return;
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
  const itemId = String(item._id || "");
  const itemUrl = `${frontendUrl}/items/${encodeURIComponent(itemId)}`;
  const emailImage = getEmailImage(item.imageUrl, itemId || "item");
  const subjectTitle = String(item.title || "New item")
    .replace(/[\r\n]+/g, " ")
    .trim();
  const isLostReport = /^lost$/i.test(String(item.type || ""));
  const reportType = isLostReport ? "lost" : "found";
  const reportTypeLabel = isLostReport ? "Lost" : "Found";
  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    try {
      const language = languageByEmail.get(recipient) || "en";
      const text = emailCopy(language);
      const translatedReportType = isLostReport ? text.lost : text.found;
      await transporter.sendMail({
        from: `"CampusFind Portal" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: language === "hi"
          ? `नई ${translatedReportType} वस्तु की रिपोर्ट: ${subjectTitle}`
          : `New ${reportType} item reported: ${subjectTitle}`,
        text: [
          language === "hi"
            ? `CampusFind पर एक नई ${translatedReportType} वस्तु की रिपोर्ट की गई है।`
            : `A new ${reportType} item has been reported on CampusFind.`,
          "",
          `${text.item}: ${item.title}`,
          `${text.category}: ${item.category || text.notProvided}`,
          `${text.location}: ${item.location || text.notProvided}`,
          `${text.date}: ${item.date || text.notProvided}`,
          `${text.description}: ${item.description || text.notProvided}`,
          ...(emailImage
            ? [
                emailImage.content
                  ? text.photoAttached
                  : `${language === "hi" ? "तस्वीर" : "Photo"}: ${emailImage.url}`,
              ]
            : []),
          "",
          `${language === "hi" ? "वस्तु देखें" : "View item"}: ${itemUrl}`,
        ].join("\n"),
        html: `
          <div lang="${language}" style="max-width:600px;margin:24px auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
            <h1 style="margin:0 0 12px;color:#047857;font-size:22px;">${language === "hi" ? `${translatedReportType} वस्तु की नई रिपोर्ट` : `New ${reportTypeLabel} item reported`}</h1>
            <p style="margin:0 0 18px;color:#475569;">${text.newItem}</p>
            <h2 style="margin:0 0 10px;font-size:19px;">${escapeHtml(item.title)}</h2>
            ${
              emailImage
                ? `<a href="${escapeHtml(emailImage.content ? itemUrl : emailImage.url)}"><img src="${emailImage.content ? `cid:${emailImage.cid}` : escapeHtml(emailImage.url)}" alt="${escapeHtml(item.title)}" style="display:block;width:100%;max-height:320px;object-fit:contain;margin:0 0 18px;border-radius:12px;background:#f1f5f9;" /></a>`
                : ""
            }
            <p><strong>${text.category}:</strong> ${escapeHtml(item.category || text.notProvided)}</p>
            <p><strong>${text.location}:</strong> ${escapeHtml(item.location || text.notProvided)}</p>
            <p><strong>${text.date}:</strong> ${escapeHtml(item.date || text.notProvided)}</p>
            <p><strong>${text.description}:</strong><br />${escapeHtml(item.description || text.notProvided).replace(/\n/g, "<br />")}</p>
            <p style="margin-top:22px;">
              <a href="${escapeHtml(itemUrl)}" style="display:inline-block;padding:11px 16px;border-radius:10px;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;">${text.viewItem}</a>
            </p>
          </div>
        `,
        ...(emailImage?.content
          ? {
              attachments: [
                {
                  filename: emailImage.filename,
                  content: emailImage.content,
                  contentType: emailImage.contentType,
                  cid: emailImage.cid,
                  contentDisposition: "inline",
                },
              ],
            }
          : {}),
      });
      sentCount += 1;
    } catch (error) {
      failedCount += 1;
      console.error(
        `Item-report notification failed (${error.code || error.name || "unknown error"}).`,
      );
    }
  }

  console.info(
    `Item-report notifications complete: ${sentCount} sent, ${failedCount} failed.`,
  );
}
