import "dotenv/config";
import mongoose from "mongoose";
import { Item } from "../src/models/Item.js";

const testOwnerEmail = "campusfind-test-data@example.invalid";
const daysAgo = (days) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

const lostItems = [
  {
    title: "CampusFind Test - Blue Backpack",
    category: "Bags",
    location: "Library, second floor",
    date: daysAgo(1),
    description: "Navy blue backpack with a small silver keychain on the front pocket.",
    contact: "test-student@example.invalid",
  },
  {
    title: "CampusFind Test - Laptop Charger",
    category: "Electronics",
    location: "Engineering building, Room 204",
    date: daysAgo(2),
    description: "Black laptop charger with a white label wrapped around its cable.",
    contact: "test-student@example.invalid",
  },
  {
    title: "CampusFind Test - Calculus Textbook",
    category: "Books",
    location: "Science library",
    date: daysAgo(3),
    description: "Calculus textbook with handwritten notes inside the front cover.",
    contact: "test-student@example.invalid",
  },
  {
    title: "CampusFind Test - Green Jacket",
    category: "Clothing",
    location: "Student center cafeteria",
    date: daysAgo(4),
    description: "Dark green hooded jacket, size medium.",
    contact: "test-student@example.invalid",
  },
  {
    title: "CampusFind Test - Key Ring",
    category: "Keys",
    location: "Parking lot near Building A",
    date: daysAgo(5),
    description: "Three keys on a round red key ring.",
    contact: "test-student@example.invalid",
  },
  {
    title: "CampusFind Test - Student Notebook",
    category: "Books",
    location: "Lecture Hall 3",
    date: daysAgo(6),
    description: "Blue spiral notebook with handwritten biology notes.",
    contact: "test-student@example.invalid",
  },
  {
    title: "CampusFind Test - Wireless Earbuds",
    category: "Electronics",
    location: "Gym reception",
    date: daysAgo(7),
    description: "White wireless earbuds in a compact charging case.",
    contact: "test-student@example.invalid",
  },
  {
    title: "CampusFind Test - Campus ID Holder",
    category: "Accessories",
    location: "Main administration building",
    date: daysAgo(8),
    description: "Clear ID holder with a blue fabric lanyard.",
    contact: "test-student@example.invalid",
  },
  {
    title: "CampusFind Test - Water Bottle",
    category: "Other",
    location: "Outdoor basketball court",
    date: daysAgo(9),
    description: "Matte black reusable water bottle with a silver lid.",
    contact: "test-student@example.invalid",
  },
  {
    title: "CampusFind Test - Calculator",
    category: "Electronics",
    location: "Mathematics building, Room 110",
    date: daysAgo(10),
    description: "Scientific calculator with a scratched protective cover.",
    contact: "test-student@example.invalid",
  },
].map((item) => ({
  ...item,
  type: "Lost",
  status: "Active",
  imageUrl: "",
  postedByEmail: testOwnerEmail,
}));

try {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campusfind",
  );

  await Item.deleteMany({ postedByEmail: testOwnerEmail });
  const insertedItems = await Item.insertMany(lostItems);

  console.log(`Added ${insertedItems.length} test lost items to ${mongoose.connection.name}.`);
} catch (error) {
  console.error("Could not seed lost test items:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
