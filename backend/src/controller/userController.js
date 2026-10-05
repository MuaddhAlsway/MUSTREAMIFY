import User from "../models/userModel.js";

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

    // Update current authenticated user
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

// ==========================================
// GET RECOMMENDED USERS
// ==========================================
export async function getRecommendedUsers(req, res) {
  try {
    const userId = req.user._id;

    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

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

// ==========================================
// GET MY FRIENDS
// ==========================================
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

export async function sendFriendRequest(req,res) {
  try{
     const myId = req.user._id;
     const {id:recipientId} = req.body;

    //  Prevent sending friend request to self
    if(myId===recipientId){
      return res.status(400).json({
        success: false,
        message: "Cannot send friend request to yourself",
      });
    }

    const recipient = await User.findById(recipientId);
    if(!recipient){
      return res.status(404).json({
        success: false,
        message: "Recipient user not found",
      });
    }

    if(recipient.friends.includes(myId)){
      return res.status(400).json({
        success: false,
        message: "You are already friends with this user",
      });
    }

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
    
    if(existingRequest){
      return res.status(400).json({
        success: false,
        message: "Friend request already exists",
      });
    }
     
  const friendRequest = new FriendRequest({
    sender: myId,
    recipient: recipientId,   
  });

  res.status(201).json({
    success: true,
    message: "Friend request sent successfully",
    friendRequest,
  })
  } catch(error){

  }
}