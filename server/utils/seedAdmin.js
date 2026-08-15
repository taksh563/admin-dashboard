import dotenv from "dotenv";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/user.model.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({
      email: "admin@example.com",
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const password = await bcrypt.hash(
      "Admin@123",
      12
    );

    await User.create({
      name: "System Administrator",
      email: "admin@example.com",
      password,
      role: "admin",
      isActive: true,
    });

    console.log("Admin created successfully");

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error("Admin seed failed:", error);

    process.exit(1);
  }
};

seedAdmin();