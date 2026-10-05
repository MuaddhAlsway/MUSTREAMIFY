import express from "express";

import {
    onboard,
    getMyFriends,
    getRecommendedUsers,
    sendFriendRequest,
} from "../controller/userController.js";

import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/onboarding", onboard);
router.get("/friends", getMyFriends);
router.get("/", getRecommendedUsers);
router.post("/friend-request/:id", sendFriendRequest);

export default router;