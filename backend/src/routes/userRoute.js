import express from "express";

import {
    onboard,
    getMyFriends,
    getRecommendedUsers,
    sendFriendRequest,
    acceptFriendRequest,
    getFriendRequests,
    getOutgoingFriendReqs,
    rejectFriendRequest,
} from "../controller/userController.js";

import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/onboarding", onboard);
router.get("/friends", getMyFriends);
router.get("/", getRecommendedUsers);
router.post("/friend-request/:id", sendFriendRequest);
router.post("/friend-request/:id/accept", acceptFriendRequest);
router.post("/friend-request/:id/reject", rejectFriendRequest);

router.get("/friend-requests", getFriendRequests)
router.get("/outgoing-friend-requests", getOutgoingFriendReqs)
export default router;