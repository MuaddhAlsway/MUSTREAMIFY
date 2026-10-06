import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";


import { upsertStreamifyUser } from "../lib/stream.js";


// ==========================================
// Generate JWT
// ==========================================
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "7d" }
  );
};

// ==========================================
// Cookie Options
// ==========================================
const getCookieOptions = () => ({
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production"
      ? "none"
      : "lax",
});

// ==========================================
// SIGNUP
// ==========================================
export async function signup(req, res) {
  try {
    const { email, password, fullName } = req.body;

    // 1. Validate required fields
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // 2. Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters long",
      });
    }

    // 3. Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Normalize email
    const normalizedEmail = email
      .toLowerCase()
      .trim();

    // 4. Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // 5. Generate random avatar
    const index =
      Math.floor(Math.random() * 100) + 1;

    const randomAvatar =
      `https://avatarapi.runflare.run/public/${index}.png`;

    // 6. Create MongoDB user
    //
    // IMPORTANT:
    // Do NOT bcrypt.hash() here.
    //
    // userSchema.pre("save") will automatically
    // hash the password before MongoDB saves it.
    const newUser = await User.create({
      fullName,
      email: normalizedEmail,
      password,
      profilePic: randomAvatar,
    });

    // 7. Create Stream user
    try {
      await upsertStreamifyUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });

      console.log(
        `Stream user created: ${newUser._id.toString()}`
      );
    } catch (streamError) {
      console.error(
        "Stream user creation failed:",
        streamError.message
      );

      // Roll back MongoDB user
      await User.findByIdAndDelete(newUser._id);

      return res.status(500).json({
        success: false,
        message: "Failed to create Stream user",
      });
    }

    // 8. Generate JWT
    const token = generateToken(newUser._id);

    // 9. Store JWT in cookie
    res.cookie(
      "token",
      token,
      getCookieOptions()
    );

    // 10. Return response
    return res.status(201).json({
      success: true,
      message: "User created successfully",

      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        bio: newUser.bio,
        nativeLanguage: newUser.nativeLanguage,
        learningLanguage: newUser.learningLanguage,
        location: newUser.location,
        isOnBoarded: newUser.isOnBoarded,
        friends: newUser.friends,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      success: false,
      message: "User creation failed",
      error: error.message,
    });
  }
}

// ==========================================
// LOGIN
// ==========================================
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // 1. Validate fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // 2. Find user
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3. Compare password
    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Generate JWT
    const token = generateToken(user._id);

    // 5. Store JWT
    res.cookie(
      "token",
      token,
      getCookieOptions()
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",

      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        nativeLanguage: user.nativeLanguage,
        learningLanguage: user.learningLanguage,
        location: user.location,
        isOnBoarded: user.isOnBoarded,
        friends: user.friends,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
}

// ==========================================
// LOGOUT
// ==========================================
export async function logout(req, res) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message,
    });
  }
}

// ==========================================
// ONBOARD USER
// ==========================================
export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const {
      fullName,
      bio,
      nativeLanguage,
      learningLanguage,
      location,
    } = req.body;

    // 1. Validate fields
    if (
      !fullName ||
      !bio ||
      !nativeLanguage ||
      !learningLanguage ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields",

        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage &&
            "nativeLanguage",
          !learningLanguage &&
            "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    // 2. Update MongoDB
    const updatedUser =
      await User.findByIdAndUpdate(
        userId,
        {
          fullName,
          bio,
          nativeLanguage,
          learningLanguage,
          location,
          isOnBoarded: true,
        },
        {
          new: true,
          runValidators: true,
        }
      ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3. Update Stream user
    await upsertStreamifyUser({
      id: updatedUser._id.toString(),
      name: updatedUser.fullName,
      image: updatedUser.profilePic || "",
    });

    // 4. Response
    return res.status(200).json({
      success: true,
      message:
        "Onboarding completed successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Onboarding error:", error);

    return res.status(500).json({
      success: false,
      message: "Onboarding failed",
      error: error.message,
    });
  }
}

// ==========================================
// FORGOT PASSWORD
// ==========================================
