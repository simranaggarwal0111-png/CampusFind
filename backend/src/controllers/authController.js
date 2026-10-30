import { User } from "../models/User.js";
import { Otp } from "../models/Otp.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { profilePictureDirectory } from "../middleware/profilePictureUpload.js";

// Helper to sign 30-min JWT and attach HTTP-only cookie
const setTokenCookie = (res, user) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "CampusFind_Secure_Token_2026_MakeItLong",
    { expiresIn: "30m" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 60 * 1000,
  });

  return token;
};

// Reusable transporter using fast port 587 STARTTLS
const getTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
  });
};

// ==================== SEND OTP ====================
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const emailLanguage = req.body.preferredLanguage === "hi" ? "hi" : "en";

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user is already registered
    const userExists = await User.findOne({ email: normalizedEmail }).lean();
    if (userExists) {
      return res.status(400).json({
        message: "An account already exists with this email address. Please log in.",
      });
    }

    // Generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store or update OTP in database
    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      { otp: otpCode, expiresAt },
      { upsert: true, new: true }
    );

    // Send email using Nodemailer
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"CampusFind Portal" <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: emailLanguage === "hi"
          ? `${otpCode} आपका CampusFind सत्यापन कोड है`
          : `${otpCode} is your CampusFind Verification Code`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800;">${emailLanguage === "hi" ? "CampusFind सत्यापन" : "CampusFind Verification"}</h1>
              <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">${emailLanguage === "hi" ? "खोया-पाया पोर्टल" : "Lost & Found Portal"}</p>
            </div>
            
            <div style="padding: 30px 24px; text-align: center; color: #1e293b;">
              <p style="font-size: 14px; color: #475569; margin-top: 0;">
                ${emailLanguage === "hi" ? "अपने ईमेल को सत्यापित करने और CampusFind पंजीकरण पूरा करने के लिए नीचे दिया गया 6 अंकों का कोड इस्तेमाल करें।" : "Use the 6-digit verification code below to verify your email and complete your CampusFind registration."}
              </p>

              <div style="margin: 24px auto; padding: 16px 28px; background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; display: inline-block;">
                <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #047857;">
                  ${otpCode}
                </span>
              </div>

              <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
                ${emailLanguage === "hi" ? "यह कोड <strong>10 मिनट</strong> में समाप्त हो जाएगा। यदि आपने अनुरोध नहीं किया है, तो इस ईमेल को अनदेखा कर सकते हैं।" : "This code will expire in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email."}
              </p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 14px 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              © ${new Date().getFullYear()} ${emailLanguage === "hi" ? "CampusFind विश्वविद्यालय नेटवर्क। सर्वाधिकार सुरक्षित।" : "CampusFind University Network. All rights reserved."}
            </div>
          </div>
        `,
      });

      return res.status(200).json({
        message: emailLanguage === "hi"
          ? `${normalizedEmail} पर 6 अंकों का सत्यापन कोड भेजा गया है।`
          : `A 6-digit verification code has been sent to ${normalizedEmail}.`,
      });
    } catch (mailError) {
      console.error("OTP email delivery failed:", {
        code: mailError.code || "UNKNOWN",
        responseCode: mailError.responseCode || null,
        command: mailError.command || null,
      });
      await Otp.deleteOne({ email: normalizedEmail, otp: otpCode });

      const message =
        mailError.code === "ETIMEDOUT" || mailError.code === "ECONNECTION"
          ? "CampusFind could not connect to Gmail to send the verification email. Check your internet connection and allow SMTP access to smtp.gmail.com on port 587 or 465, then try again."
          : "CampusFind could not send the verification email. Check the email server settings and try again later.";

      return res.status(502).json({
        message,
      });
    }
  } catch (error) {
    console.error("sendOtp error:", error);
    return res.status(500).json({
      message: "Failed to send verification code. Please check your email address and try again.",
      error: error.message,
    });
  }
};

// ==================== VERIFY OTP (STANDALONE CHECK) ====================
export const verifyOtpOnly = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP code are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = await Otp.findOne({ email: normalizedEmail, otp: otp.trim() });

    if (!record) {
      return res.status(400).json({ message: "Invalid or expired OTP code." });
    }

    if (new Date() > record.expiresAt) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
    }

    return res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Verification error: " + error.message });
  }
};

// ==================== REGISTER (VERIFIES OTP THEN SUBMITS) ====================
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, otp, adminSecret } = req.body;
    const preferredLanguage = req.body.preferredLanguage === "hi" ? "hi" : "en";

    if (!name?.trim() || !email?.trim() || !password || !otp?.trim()) {
      return res.status(400).json({
        message: "Full name, email, password, and OTP code are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Verify OTP first
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      otp: otp.trim(),
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Invalid verification code. Please check your email or request a new code.",
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        message: "Verification code has expired. Please request a new code.",
      });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail }).lean();
    if (userExists) {
      return res.status(400).json({
        message: "An account already exists with this email address. Please log in.",
      });
    }

    // 3. Delete OTP record once successfully used
    await Otp.deleteOne({ _id: otpRecord._id });

    // 4. Role determination: check admin secret passcode
    const expectedSecret = process.env.ADMIN_SECRET || "admin123";
    const role = (adminSecret && adminSecret.trim() === expectedSecret) ? "admin" : "student";

    // 5. Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      preferredLanguage,
    });

    // 6. Auto login: Set 30-min JWT cookie
    const token = setTokenCookie(res, user);

    // 7. Send welcome email non-blocking in background
    setImmediate(async () => {
      try {
        const transporter = getTransporter();
        await transporter.sendMail({
          from: `"CampusFind Portal" <${process.env.EMAIL_USER}>`,
          to: normalizedEmail,
          subject: preferredLanguage === "hi"
            ? "CampusFind में आपका स्वागत है! पंजीकरण सफल"
            : "Welcome to CampusFind! Registration Successful",
          html: `
            <div style="font-family: sans-serif; padding: 24px; color: #1e293b;">
              <h2 style="color: #059669;">${preferredLanguage === "hi" ? `CampusFind में आपका स्वागत है, ${user.name}!` : `Welcome to CampusFind, ${user.name}!`}</h2>
              <p>${preferredLanguage === "hi" ? `आपका कैंपस ईमेल सत्यापित हो गया है और आपका खाता <strong>${user.role === "admin" ? "व्यवस्थापक" : "छात्र"}</strong> के रूप में सक्रिय है।` : `Your campus email has been verified and your account is active as <strong>${user.role}</strong>.`}</p>
              <p>${preferredLanguage === "hi" ? "अब आप खोई हुई वस्तुओं की रिपोर्ट कर सकते हैं, मिली हुई वस्तुएँ देख सकते हैं और डिजिटल सुपुर्दगी पास प्रबंधित कर सकते हैं।" : "You can now report lost items, browse found items, and manage digital handover passes."}</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b;">${preferredLanguage === "hi" ? "केंद्रीय सुरक्षा केंद्र • भवन B, कमरा 102" : "Central Security Station • Building B, Room 102"}</p>
            </div>
          `,
        });
      } catch (err) {
        console.log("Welcome email background notice:", err.message);
      }
    });

    return res.status(201).json({
      message: "Email verified and account created successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Registration error: " + error.message,
    });
  }
};

// ==================== LOGIN ====================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Fast indexed query
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Set 30-min JWT cookie
    const token = setTokenCookie(res, user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login error: " + error.message });
  }
};

// ==================== LOGOUT ====================
export const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
  });
  return res.status(200).json({ message: "Logged out successfully" });
};

// ==================== GET CURRENT USER ====================
export const getMe = (req, res) => {
  return res.status(200).json({ user: req.user });
};

export const updatePreferredLanguage = async (req, res) => {
  const { preferredLanguage } = req.body;
  if (!["en", "hi"].includes(preferredLanguage)) {
    return res.status(400).json({ message: "Language must be 'en' or 'hi'." });
  }

  req.user.preferredLanguage = preferredLanguage;
  await req.user.save();
  return res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profilePicture: req.user.profilePicture,
      preferredLanguage: req.user.preferredLanguage,
    },
  });
};

const removeProfilePictureFile = async (profilePicture) => {
  const filename = path.basename(profilePicture || "");
  if (
    !filename ||
    profilePicture !== `/uploads/profile-pictures/${filename}`
  ) {
    return;
  }

  try {
    await unlink(path.join(profilePictureDirectory, filename));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

export const updateProfilePicture = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Choose a profile picture to upload." });
  }

  const previousPicture = req.user.profilePicture;
  req.user.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;

  try {
    await req.user.save();
  } catch (error) {
    try {
      await removeProfilePictureFile(req.user.profilePicture);
    } catch (cleanupError) {
      console.error("Could not remove an un-saved profile picture:", cleanupError);
    }
    return res.status(500).json({ message: "Could not save the profile picture." });
  }

  try {
    await removeProfilePictureFile(previousPicture);
  } catch (error) {
    console.error("Could not remove the previous profile picture:", error);
  }

  return res.status(200).json({
    message: "Profile picture updated successfully.",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profilePicture: req.user.profilePicture,
      preferredLanguage: req.user.preferredLanguage,
    },
  });
};

export const deleteProfilePicture = async (req, res) => {
  const previousPicture = req.user.profilePicture;
  req.user.profilePicture = "";

  try {
    await req.user.save();
  } catch (error) {
    return res.status(500).json({ message: "Could not remove the profile picture." });
  }

  try {
    await removeProfilePictureFile(previousPicture);
  } catch (error) {
    console.error("Could not remove the deleted profile picture file:", error);
  }

  return res.status(200).json({
    message: "Profile picture removed successfully.",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profilePicture: req.user.profilePicture,
      preferredLanguage: req.user.preferredLanguage,
    },
  });
};

// ==================== ADMIN SETUP BOOTSTRAP ====================
export const setupInitialAdmin = async (req, res) => {
  try {
    const { name, email, password, adminSecret } = req.body;
    const expectedSecret = process.env.ADMIN_SECRET || "admin123";

    if (adminSecret !== expectedSecret) {
      return res.status(403).json({ message: "Invalid admin setup passcode." });
    }

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      user.role = "admin";
      user.password = await bcrypt.hash(password, 10);
      user.name = name.trim();
      await user.save();
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "admin",
        preferredLanguage: req.body.preferredLanguage === "hi" ? "hi" : "en",
      });
    }

    const token = setTokenCookie(res, user);

    return res.status(200).json({
      message: `Admin account '${user.name}' configured successfully!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Admin setup failed: " + err.message });
  }
};

// ==================== ADMIN: GET ALL USERS ====================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

// ==================== ADMIN: UPDATE USER ROLE ====================
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["student", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'student' or 'admin'." });
    }

    // Prevent admin from removing their own admin status
    if (req.user?._id?.toString() === id && role !== "admin") {
      return res.status(400).json({ message: "You cannot revoke your own admin rights." });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: `User '${user.name}' role updated to ${role}.`,
      user,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update role", error: err.message });
  }
};
