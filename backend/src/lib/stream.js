import { StreamChat } from "stream-chat";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  throw new Error(
    "STREAM_API_KEY and STREAM_API_SECRET must be provided"
  );
}

export const streamClient = StreamChat.getInstance(
  apiKey,
  apiSecret
);

// ==========================================
// UPSERT STREAM USER
// ==========================================
export const upsertStreamifyUser = async (userData) => {
  try {
    await streamClient.upsertUsers([userData]);

    console.log(`Stream user upserted: ${userData.id}`);

    return userData;
  } catch (error) {
    console.error("Error upserting Stream user:", error);
    throw error;
  }
};

// ==========================================
// GENERATE STREAM TOKEN
// ==========================================
export const generateStreamToken = (userId) => {
  try {
    const userIdStr = userId.toString();
    return streamClient.createToken(userIdStr);
  } catch (error) {
    console.error("Error generating Stream token:", error);
    throw error;
  }
};