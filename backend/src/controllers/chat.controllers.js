import { generateStreamToken, deleteStreamMessage } from "../lib/stream.js";

const MESSAGE_AUTO_DELETE_SECONDS = 60;

export async function getStreamToken(req, res) {
  try {
    const token = generateStreamToken(req.user.id);

    res.status(200).json({ token });
  } catch (error) {
    console.error("Error in getStreamToken controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function scheduleMessageDeletion(req, res) {
  try {
    const { messageId, timeoutSeconds = MESSAGE_AUTO_DELETE_SECONDS } = req.body;

    if (!messageId) {
      return res.status(400).json({ message: "Message ID is required" });
    }

    const timeoutMs = Math.min(Math.max(Number(timeoutSeconds) || 60, 1), 300) * 1000;

    setTimeout(async () => {
      try {
        await deleteStreamMessage(messageId, true);
        console.log(`Auto-deleted message ${messageId}`);
      } catch (err) {
        console.error("Failed to auto-delete message:", err.message);
      }
    }, timeoutMs);

    res.status(200).json({ success: true, message: "Deletion scheduled" });
  } catch (error) {
    console.error("Error in scheduleMessageDeletion:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
