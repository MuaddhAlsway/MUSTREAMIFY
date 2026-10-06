import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"
import authRoutes from "./routes/authRoute.js";
import userRoutes from "./routes/userRoute.js";
import chatRoutes from "./routes/chatRoute.js"
import { connectDB } from "./lib/db.js";

const app = express();

const PORT = process.env.PORT || 5001;

// ==========================================
// Middleware
// ==========================================
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,// allow frontend to send cookies
}))
// ==========================================
// Routes
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("api/chat", chatRoutes)
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