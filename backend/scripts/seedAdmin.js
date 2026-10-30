import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { connectDB } from "../src/config/db.js";
import { User } from "../src/models/User.js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

async function createAdminUser() {
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password =
      process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || "admin123";
    const name = process.env.ADMIN_NAME || "Campus Administrator";

    if (!email) {
      console.error("Error: ADMIN_EMAIL is not defined in .env file.");
      process.exit(1);
    }

    console.log("Connecting to MongoDB Atlas...");
    await connectDB();

    const hashedPassword = await bcrypt.hash(password, 10);

    let user = await User.findOne({ email });

    if (user) {
      user.role = "admin";
      user.name = name;
      user.password = hashedPassword;
      await user.save();
      console.log(`\n✅ Existing user '${email}' upgraded/updated to Admin successfully!`);
    } else {
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "admin",
        preferredLanguage: "en",
      });
      console.log(`\n✅ Admin account created successfully!`);
    }

    console.log("-----------------------------------------");
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role:     ${user.role}`);
    console.log("-----------------------------------------");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to create admin user:", error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

createAdminUser();

