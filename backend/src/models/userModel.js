import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ==========================================
// USER SCHEMA
// ==========================================

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    bio: {
      type: String,
      default: "",
    },

    profilePic: {
      type: String,
      default: "",
    },

    nativeLanguage: {
      type: String,
      default: "",
    },

    learningLanguage: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    isOnBoarded: {
      type: Boolean,
      default: false,
    },

    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ==========================================
    // PASSWORD RESET
    // ==========================================

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// PASSWORD HASHING MIDDLEWARE
// ==========================================

userSchema.pre("save", async function (next) {
  try {
    // If password wasn't changed,
    // don't hash it again.
    if (!this.isModified("password")) {
      return next();
    }

    // Generate salt
    const salt = await bcrypt.genSalt(10);

    // Hash password
    this.password = await bcrypt.hash(
      this.password,
      salt
    );

    next();
  } catch (error) {
    next(error);
  }
});

// ==========================================
// CREATE USER MODEL
// ==========================================

const User = mongoose.model("User", userSchema);

export default User;