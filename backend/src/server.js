import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoute.js";
import userRoutes from "./routes/userRoute.js";
import { connectDB } from "./lib/db.js";

const app = express();

const PORT = process.env.PORT || 5001;

// ==========================================
// Middleware
// ==========================================
app.use(express.json());
app.use(cookieParser());

// ==========================================
// Routes
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
// ==========================================
// Health Check
// ==========================================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

// ==========================================
// Start Server
// ==========================================
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Start Express only after DB connection succeeds
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();