import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { getStreamToken, scheduleMessageDeletion } from "../lib/api";
import { useState, useEffect, useRef } from "react";
import useAuthUser from "../hooks/useAuthUser";
import ChatLoader from "../components/ChatLoader";
import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
  useMessageContext,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import CallButton from "../components/CallButton";
import { useThemeStore } from "../Store/useThemeStore";

const VITE_STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

/* ─────────────────────────────────────────────────────────────
   Tick SVGs
───────────────────────────────────────────────────────────── */
const SingleTick = ({ color }) => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
    <path
      d="M1 5L4.5 8.5L13 1"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DoubleTick = ({ color }) => (
  <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
    <path
      d="M1 5.5L4.5 9L10.5 2"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 5.5L10.5 9L16.5 2"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Reaction map  (type ↔ emoji)
───────────────────────────────────────────────────────────── */
const REACTIONS = [
  { emoji: "👍", type: "like" },
  { emoji: "❤️", type: "love" },
  { emoji: "😂", type: "haha" },
  { emoji: "😮", type: "wow" },
  { emoji: "😢", type: "sad" },
  { emoji: "🙏", type: "pray" },
];
const TYPE_TO_EMOJI = Object.fromEntries(
  REACTIONS.map(({ emoji, type }) => [type, emoji]),
);

/* ─────────────────────────────────────────────────────────────
   Emoji popup bar
───────────────────────────────────────────────────────────── */
const EmojiPopup = ({ onSelect, onClose, isMine, myReactionType }) => {
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", fn);
    document.addEventListener("touchstart", fn);
    return () => {
      document.removeEventListener("mousedown", fn);
      document.removeEventListener("touchstart", fn);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute z-50 bottom-full mb-2 flex items-center gap-0.5 px-2 py-1.5
        rounded-full shadow-2xl bg-[#233138] border border-[#2a3942]
        ${isMine ? "right-0" : "left-0"}`}
      style={{ whiteSpace: "nowrap" }}
    >
      {REACTIONS.map(({ emoji, type }) => {
        const isActive = myReactionType === type;
        return (
          <button
            key={type}
            onClick={() => {
              onSelect(type);
              onClose();
            }}
            title={isActive ? "Remove reaction" : "React"}
            className={`text-[22px] leading-none w-9 h-9 flex items-center justify-center
              rounded-full transition-all duration-150 active:scale-95
              ${
                isActive
                  ? "bg-white/20 scale-110 ring-2 ring-white/30"
                  : "hover:scale-125 hover:bg-white/10"
              }`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Custom message bubble
───────────────────────────────────────────────────────────── */
const CustomMessage = () => {
  const { message, isMyMessage, handleReaction } = useMessageContext();
  const { authUser } = useAuthUser(); // to find my own reaction
  const [showEmoji, setShowEmoji] = useState(false);
  const isMine = isMyMessage();

  /* Time string */
  const time = new Date(message.created_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  /* Tick state */
  const isSending = message.status === "sending";
  const isRead = message.readBy && message.readBy.length > 1;

  /* ── Find the current user's existing reaction (if any) ──
     Stream stores own_reactions as an array of reaction objects.        */
  const ownReactions = message.own_reactions || [];
  const myReactionType = ownReactions.length > 0 ? ownReactions[0].type : null;

  /* ── Aggregate reaction pills ──────────────────────────
     We want one pill per emoji type showing total count.  */
  const reactionCounts = message.reaction_counts || {};
  const hasReactions = Object.keys(reactionCounts).length > 0;

  /* ── Handle reaction toggle: one-at-a-time logic ────────
     • If user taps same emoji  → remove (Stream removeReaction)
     • If user taps diff emoji  → first remove old, then add new
     Stream's handleReaction already does add+toggle internally,
     but we manually ensure only one exists at a time.          */
  const onReact = async (type) => {
    try {
      if (myReactionType && myReactionType !== type) {
        // remove current reaction first, then add new
        await handleReaction(myReactionType); // toggles off
        await handleReaction(type); // adds new
      } else {
        // same type → toggles off; or no previous → adds
        await handleReaction(type);
      }
    } catch (err) {
      console.error("Reaction error:", err);
    }
  };

  return (
    <div
      className={`flex w-full mb-1 px-2 sm:px-4
        ${isMine ? "justify-end" : "justify-start"}`}
    >
      <div className="relative max-w-[75%] sm:max-w-[62%] group">
        {/* Smiley trigger (hover) */}
        <button
          onClick={() => setShowEmoji((v) => !v)}
          className={`absolute top-2 opacity-0 group-hover:opacity-100 z-10
            transition-opacity duration-150 text-[#8696a0] hover:text-white
            ${isMine ? "-left-8" : "-right-8"}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 13s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>

        {/* Emoji picker popup */}
        {showEmoji && (
          <EmojiPopup
            isMine={isMine}
            myReactionType={myReactionType}
            onClose={() => setShowEmoji(false)}
            onSelect={onReact}
          />
        )}

        {/* ── Bubble ── */}
        <div
          className={`relative px-3 pt-2 pb-1.5 shadow-md
            ${
              isMine
                ? "bg-[#005c4b] text-white rounded-2xl rounded-tr-sm"
                : "bg-[#202c33] text-[#e9edef] rounded-2xl rounded-tl-sm"
            }`}
          style={{ wordBreak: "break-word" }}
        >
          {/* Sender name (received only) */}
          {!isMine && message.user?.name && (
            <p className="text-xs font-semibold text-[#00a884] mb-0.5 leading-tight truncate">
              {message.user.name}
            </p>
          )}

          {/* Message text + invisible spacer for time overlap */}
          <div className="text-sm leading-relaxed">
            {message.text}
            <span
              className="inline-block w-16 h-3 align-bottom"
              aria-hidden="true"
            />
          </div>

          {/* Time + ticks — absolute bottom-right */}
          <div className="absolute bottom-1.5 right-2.5 flex items-center gap-0.5">
            <span
              className="text-[10px] leading-none"
              style={{
                color: isMine
                  ? "rgba(255,255,255,0.55)"
                  : "rgba(233,237,239,0.45)",
              }}
            >
              {time}
            </span>
            {isMine && (
              <>
                {isSending && <SingleTick color="rgba(255,255,255,0.45)" />}
                {!isSending && !isRead && (
                  <DoubleTick color="rgba(255,255,255,0.55)" />
                )}
                {isRead && <DoubleTick color="#53BDEB" />}
              </>
            )}
          </div>
        </div>

        {/* ── Reaction pills below bubble ── */}
        {hasReactions && (
          <div
            className={`flex flex-wrap gap-1 mt-1
              ${isMine ? "justify-end" : "justify-start"}`}
          >
            {Object.entries(reactionCounts).map(([type, count]) => {
              const isMineReaction = myReactionType === type;
              return (
                <button
                  key={type}
                  onClick={() => onReact(type)}
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-sm
                    border shadow transition-all duration-150
                    ${
                      isMineReaction
                        ? "bg-[#00a884]/20 border-[#00a884]/50 ring-1 ring-[#00a884]/40"
                        : "bg-[#233138] border-[#2a3942] hover:bg-[#2a3942]"
                    }`}
                >
                  <span>{TYPE_TO_EMOJI[type] || "👍"}</span>
                  {count > 1 && (
                    <span className="text-[11px] text-[#8696a0] ml-0.5">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Date separator
───────────────────────────────────────────────────────────── */
const DateSeparator = ({ date }) => {
  const d = new Date(date);
  const now = new Date();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  const label = same(d, now)
    ? "Today"
    : same(d, yest)
      ? "Yesterday"
      : d.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

  return (
    <div className="flex justify-center my-4 px-4">
      <span className="px-4 py-1 rounded-full text-xs font-medium bg-[#182229] text-[#8696a0] border border-[#2a3942] shadow-sm">
        {label}
      </span>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   ChatPage
───────────────────────────────────────────────────────────── */
const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const { authUser } = useAuthUser();
  const { chatBackgroundValue } = useThemeStore();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;
      try {
        const client = StreamChat.getInstance(VITE_STREAM_API_KEY);
        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token,
        );
        const channelId = [authUser._id, targetUserId].sort().join("-");
        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });
        await currChannel.watch();

        currChannel.on("message.read", async (event) => {
          if (event.user?.id === targetUserId) {
            currChannel.state.messages.forEach(async (msg) => {
              if (msg.user.id === authUser._id && !msg.deletionScheduled) {
                try {
                  await scheduleMessageDeletion(msg.id, 60);
                  msg.deletionScheduled = true;
                } catch (err) {
                  console.error("Auto-delete schedule failed:", err);
                }
              }
            });
          }
        });

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    initChat();
  }, [tokenData, authUser, targetUserId]);

  const sendCall = (type) => {
    if (!channel) return;
    const suffix = type === "voice" ? "?audio=true" : "";
    channel.sendMessage({
      text: `I've started a ${type} call. Join me here: ${window.location.origin}/call/${channel.id}${suffix}`,
    });
    toast.success(`${type === "voice" ? "Voice" : "Video"} call link sent!`);
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div
      className="min-h-[93vh] select-none touch-none transition-colors duration-300"
      style={{
        background: chatBackgroundValue || "#0b141a",
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      <div className="h-[93vh]">
        <Chat client={chatClient}>
          <Channel
            channel={channel}
            Message={CustomMessage}
            DateSeparator={DateSeparator}
            returnAllReadData={true}
          >
            <div className="w-full relative">
              <CallButton
                handleVideoCall={() => sendCall("video")}
                handleVoiceCall={() => sendCall("voice")}
              />
              <Window>
                <ChannelHeader />
                <MessageList />
                <MessageInput focus />
              </Window>
            </div>
            <Thread />
          </Channel>
        </Chat>
      </div>
    </div>
  );
};

export default ChatPage;
