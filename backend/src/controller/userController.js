import User from "../models/userModel.js";
import FriendRequest from "../models/friendRequestModel.js";

// ======================================================
// ONBOARD USER
// ======================================================
export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const {
      fullName,
      bio,
      nativeLanguage,
      learningLanguage,
      location,
      profilePic,
    } = req.body;

    // Validate required fields
    if (
      !fullName ||
      !bio ||
      !nativeLanguage ||
      !learningLanguage ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",

        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    // Update authenticated user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        bio,
        nativeLanguage,
        learningLanguage,
        location,
        profilePic,
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

    return res.status(200).json({
      success: true,
      message: "Onboarding completed successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Onboarding error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete onboarding",
      error: error.message,
    });
  }
}

// ======================================================
// GET RECOMMENDED USERS
// ======================================================
export async function getRecommendedUsers(req, res) {
  try {
    const userId = req.user._id;

    // Find current user
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find users who are:
    // 1. Not current user
    // 2. Not already friends
    // 3. Already onboarded
    const recommendedUsers = await User.find({
      _id: {
        $ne: userId,
        $nin: currentUser.friends,
      },

      isOnBoarded: true,
    }).select("-password");

    return res.status(200).json({
      success: true,
      users: recommendedUsers,
    });
  } catch (error) {
    console.error("Error fetching recommended users:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch recommended users",
      error: error.message,
    });
  }
}

// ======================================================
// GET MY FRIENDS
// ======================================================
export async function getMyFriends(req, res) {
  try {
    const userId = req.user._id;

    const currentUser = await User.findById(userId).populate({
      path: "friends",

      select:
        "fullName profilePic nativeLanguage learningLanguage location",
    });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      friends: currentUser.friends,
    });
  } catch (error) {
    console.error("Error fetching friends:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch friends",
      error: error.message,
    });
  }
}

// ======================================================
// SEND FRIEND REQUEST
// ======================================================
export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user._id;

    // User receiving the friend request
    const { id: recipientId } = req.params;

    // --------------------------------------------------
    // 1. Prevent sending request to yourself
    // --------------------------------------------------
    if (myId.toString() === recipientId) {
      return res.status(400).json({
        success: false,
        message: "Cannot send friend request to yourself",
      });
    }

    // --------------------------------------------------
    // 2. Check recipient exists
    // --------------------------------------------------
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient user not found",
      });
    }

    // --------------------------------------------------
    // 3. Check if users are already friends
    // --------------------------------------------------
    const alreadyFriends = recipient.friends.some(
      (friendId) => friendId.toString() === myId.toString()
    );

    if (alreadyFriends) {
      return res.status(400).json({
        success: false,
        message: "You are already friends with this user",
      });
    }

    // --------------------------------------------------
    // 4. Check if friend request already exists
    //    in either direction
    // --------------------------------------------------
    const existingRequest = await FriendRequest.findOne({
      $or: [
        {
          sender: myId,
          recipient: recipientId,
        },
        {
          sender: recipientId,
          recipient: myId,
        },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Friend request already exists",
      });
    }

    // --------------------------------------------------
    // 5. Create friend request
    // --------------------------------------------------
    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    return res.status(201).json({
      success: true,
      message: "Friend request sent successfully",
      friendRequest,
    });
  } catch (error) {
    console.error("Error sending friend request:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send friend request",
      error: error.message,
    });
  }
}

// ======================================================
// ACCEPT FRIEND REQUEST
// ======================================================
export async function acceptFriendRequest(req, res) {
  try {
    const myId = req.user._id;

    const { id: requestId } = req.params;

    // --------------------------------------------------
    // 1. Find friend request
    // --------------------------------------------------
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    // --------------------------------------------------
    // 2. Only recipient can accept
    // --------------------------------------------------
    if (friendRequest.recipient.toString() !== myId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to accept this request",
      });
    }

    // --------------------------------------------------
    // 3. Check request status
    // --------------------------------------------------
    if (friendRequest.status === "accepted") {
      return res.status(400).json({
        success: false,
        message: "Friend request already accepted",
      });
    }

    if (friendRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot accept a ${friendRequest.status} request`,
      });
    }

    // --------------------------------------------------
    // 4. Update request status
    // --------------------------------------------------
    friendRequest.status = "accepted";

    await friendRequest.save();

    // --------------------------------------------------
    // 5. Add recipient to sender's friends
    // --------------------------------------------------
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: {
        friends: friendRequest.recipient,
      },
    });

    // --------------------------------------------------
    // 6. Add sender to recipient's friends
    // --------------------------------------------------
    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: {
        friends: friendRequest.sender,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Friend request accepted successfully",
      friendRequest,
    });
  } catch (error) {
    console.error("Error accepting friend request:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept friend request",
      error: error.message,
    });
  }
}


export async function getFriendRequests(req, res) {
  try {
    const userId = req.user._id;

    // ==========================================
    // INCOMING PENDING FRIEND REQUESTS
    // ==========================================
    const incomingReqs = await FriendRequest.find({
      recipient: userId,
      status: "pending",
    }).populate(
      "sender",
      "fullName profilePic nativeLanguage learningLanguage"
    );

    // ==========================================
    // ACCEPTED FRIEND REQUESTS
    // ==========================================
    const acceptedReqs = await FriendRequest.find({
      recipient: userId,
      status: "accepted",
    }).populate(
      "sender",
      "fullName profilePic"
    );

    return res.status(200).json({
      success: true,
      incomingReqs,
      acceptedReqs,
    });
  } catch (error) {
    console.error(
      "Error in getFriendRequests controller:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
// 1:51:34

export async function getOutgoingFriendReqs(req, res) {
  try {
    const userId = req.user._id;

    const outgoingRequests = await FriendRequest.find({
      sender: userId,
      status: "pending",
    }).populate(
      "recipient",
      "fullName profilePic nativeLanguage learningLanguage"
    );

    return res.status(200).json({
      success: true,
      outgoingRequests,
    });
  } catch (error) {
    console.error(
      "Error in getOutgoingFriendReqs controller:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ==========================================
// REJECT FRIEND REQUEST
// ==========================================
export async function rejectFriendRequest(req, res) {
  try {
    const myId = req.user._id;
    const { id: requestId } = req.params;

    // 1. Find friend request
    const friendRequest = await FriendRequest.findById(
      requestId
    );

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    // 2. Only the recipient can reject it
    if (
      friendRequest.recipient.toString() !==
      myId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to reject this request",
      });
    }

    // 3. Only pending requests can be rejected
    if (friendRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a ${friendRequest.status} request`,
      });
    }

    // 4. Change status
    friendRequest.status = "rejected";

    await friendRequest.save();

    return res.status(200).json({
      success: true,
      message: "Friend request rejected",
      friendRequest,
    });
  } catch (error) {
    console.error(
      "Error rejecting friend request:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}