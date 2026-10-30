import nodemailer from "nodemailer";

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

export async function sendRecoveryNotification(report, item, ownerEmail) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !ownerEmail) {
    console.warn(
      "Recovery request was saved, but its email notification was skipped because email credentials or owner email are missing.",
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
  const frontendUrl = (
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:5173")
  ).replace(/\/+$/, "");
  const dashboardUrl = `${frontendUrl}/my-activity?tab=recovery`;
  const foundDate = new Date(report.foundDate).toLocaleDateString();
  const fields = [
    `Item: ${item.title}`,
    `Finder: ${report.finderName}`,
    `Finder email: ${report.finderEmail}`,
    `Finder phone: ${report.finderPhone || "Not provided"}`,
    `Found at: ${report.foundLocation}`,
    `Found date: ${foundDate}`,
    `Additional details: ${report.description}`,
    "",
    `Manage this request: ${dashboardUrl}`,
  ];

  try {
    await transporter.sendMail({
      from: `"CampusFind Portal" <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      replyTo: report.finderEmail,
      subject: `Recovery update for your item: ${String(item.title).replace(/[\r\n]+/g, " ")}`,
      text: fields.join("\n"),
      html: `
        <div style="max-width:600px;margin:24px auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
          <h1 style="color:#047857;font-size:22px;">Someone found your item</h1>
          <h2 style="font-size:18px;">${escapeHtml(item.title)}</h2>
          <p><strong>Finder:</strong> ${escapeHtml(report.finderName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(report.finderEmail)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(report.finderPhone || "Not provided")}</p>
          <p><strong>Found at:</strong> ${escapeHtml(report.foundLocation)}</p>
          <p><strong>Found date:</strong> ${escapeHtml(foundDate)}</p>
          <p><strong>Additional details:</strong><br />${escapeHtml(report.description).replace(/\n/g, "<br />")}</p>
          <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;margin-top:12px;padding:11px 16px;border-radius:10px;background:#059669;color:#fff;text-decoration:none;font-weight:700;">Manage recovery request</a>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error(
      `Recovery request was saved, but its email notification failed (${error.code || error.name || "unknown error"}).`,
    );
    return false;
  }
}
