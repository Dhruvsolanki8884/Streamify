import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY || process.env.VITE_STREAM_API_KEY;
const apiSecret =
  process.env.STREAM_API_SECRET || process.env.VITE_STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error(
    "Stream API key or Secret is missing. Add STREAM_API_KEY and STREAM_API_SECRET to your .env file.",
  );
}

const StreamClient = StreamChat.getInstance(apiKey, apiSecret);

export const ensureReadEventsEnabled = async () => {
  try {
    await StreamClient.updateChannelType("messaging", {
      read_events: true,
      delivery_events: true,
    });
    console.log("Stream: read_events and delivery_events enabled");
  } catch (err) {
    console.log("Stream channel config:", err.message || err);
  }
};

export const upsertStreamUser = async (userData) => {
  try {
    await StreamClient.upsertUsers([userData]);
    return userData;
  } catch (error) {
    console.log("Error upserting stream  user:", error);
  }
};

// todo : do it later

export const generateStreamToken = (userId) => {
  try {
    const userIdStr = userId.toString();
    return StreamClient.createToken(userIdStr);
  } catch (error) {
    console.log("Error generating stream token:", error);
  }
};

export const deleteStreamMessage = async (messageId, hardDelete = true) => {
  try {
    await StreamClient.deleteMessage(messageId, hardDelete);
    return true;
  } catch (error) {
    console.error("Error deleting Stream message:", error.message);
    throw error;
  }
};
