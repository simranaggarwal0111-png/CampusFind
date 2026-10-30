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

export async function sendClaimNotification(claim, item) {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !adminEmail) {
    console.warn(
      "Claim was saved, but admin email notification is not configured. Set EMAIL_USER, EMAIL_PASS, and ADMIN_EMAIL.",
    );
    return false;
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

  try {
    const admin = await User.findOne({ email: adminEmail.toLowerCase() })
      .select("preferredLanguage")
      .lean();
    const language = admin?.preferredLanguage === "hi" ? "hi" : "en";
    const text = emailCopy(language);
    const itemImage = item.imageUrl
      ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" style="display:block;width:100%;max-height:240px;object-fit:cover;border-radius:12px;border:1px solid #e2e8f0;" />`
      : "";
    const submittedAt = new Date(claim.createdAt || Date.now()).toLocaleString(
      language === "hi" ? "hi-IN" : "en-US",
      { dateStyle: "medium", timeStyle: "short" },
    );

    await transporter.sendMail({
      from: `"CampusFind Portal" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      ...(claim.studentEmail ? { replyTo: claim.studentEmail } : {}),
      subject: `${text.newClaimSubject}: ${item.title}`,
      text: [
        `CAMPUSFIND — ${text.newClaim.toUpperCase()}`,
        "",
        `Item: ${item.title}`,
        `${text.category}: ${item.category || text.notProvided}`,
        `${text.location}: ${item.location || text.notProvided}`,
        `${text.submitted}: ${submittedAt}`,
        "",
        `Claimant: ${claim.studentName}`,
        `ईमेल: ${claim.studentEmail || text.notProvided}`,
        `संपर्क: ${claim.contact}`,
        `${text.ownershipDetails}: ${claim.proofDescription}`,
        "",
        `Claim code: ${claim.claimCode}`,
        `Claim ID: ${claim._id}`,
        "",
        text.reviewInDashboard,
      ].join("\n"),
      html: `
        <!doctype html>
        <html lang="${language}">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>${text.newClaim}</title>
          </head>
          <body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
              ${text.reviewClaim}
            </div>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
              <tr>
                <td style="padding:28px 30px;background:#064e3b;background-image:linear-gradient(135deg,#047857,#0f766e);color:#ffffff;">
                  <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a7f3d0;">CampusFind • ${text.claimTracking}</div>
                  <h1 style="margin:12px 0 8px;font-size:25px;line-height:1.25;">${text.newClaim}</h1>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#d1fae5;">${text.reviewClaim}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 30px 8px;">
                  <div style="display:inline-block;padding:6px 10px;border-radius:999px;background:#fffbeb;border:1px solid #fde68a;color:#92400e;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;">${text.pending}</div>
                  <h2 style="margin:14px 0 5px;font-size:21px;line-height:1.35;">${escapeHtml(item.title)}</h2>
                  <p style="margin:0;color:#64748b;font-size:13px;">${escapeHtml(item.category || text.item)} &nbsp;•&nbsp; ${escapeHtml(item.location || text.notProvided)}</p>
                </td>
              </tr>
              ${
                itemImage
                  ? `<tr><td style="padding:16px 30px 8px;">${itemImage}</td></tr>`
                  : ""
              }
              <tr>
                <td style="padding:16px 30px 8px;">
                  <h3 style="margin:0 0 12px;font-size:14px;color:#334155;">${text.claimantDetails}</h3>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;font-size:13px;">
                    <tr><td style="padding:9px 0;border-bottom:1px solid #e2e8f0;color:#64748b;width:125px;">${language === "hi" ? "नाम" : "Name"}</td><td style="padding:9px 0;border-bottom:1px solid #e2e8f0;font-weight:600;">${escapeHtml(claim.studentName)}</td></tr>
                    <tr><td style="padding:9px 0;border-bottom:1px solid #e2e8f0;color:#64748b;">${language === "hi" ? "ईमेल" : "Email"}</td><td style="padding:9px 0;border-bottom:1px solid #e2e8f0;">${escapeHtml(claim.studentEmail || text.notProvided)}</td></tr>
                    <tr><td style="padding:9px 0;color:#64748b;">${language === "hi" ? "संपर्क" : "Contact"}</td><td style="padding:9px 0;">${escapeHtml(claim.contact)}</td></tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 30px 8px;">
                  <div style="padding:16px;border:1px solid #dbeafe;border-radius:12px;background:#f8fafc;">
                    <div style="margin-bottom:7px;font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#64748b;">${text.ownershipDetails}</div>
                    <div style="font-size:13px;line-height:1.65;color:#334155;white-space:pre-wrap;">${escapeHtml(claim.proofDescription)}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 30px 24px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;">
                    <tr><td style="padding:14px 16px;">
                      <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#047857;">${text.claimTracking}</div>
                      <div style="margin-top:5px;font-family:monospace;font-size:20px;font-weight:700;letter-spacing:2px;color:#065f46;">${escapeHtml(claim.claimCode)}</div>
                    </td></tr>
                  </table>
                  <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#475569;">${text.reviewInDashboard}</p>
                  <p style="margin:12px 0 0;font-size:11px;color:#94a3b8;">${text.submitted} ${escapeHtml(submittedAt)} &nbsp;•&nbsp; दावा ID: ${escapeHtml(claim._id)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;line-height:1.6;color:#94a3b8;">
                  ${text.automated}<br />
                  ${text.noReply}
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    return true;
  } catch (error) {
    console.error(
      `Claim was saved, but admin email notification failed (${error.code || error.name || "unknown error"}).`,
    );
    return false;
  }
}
