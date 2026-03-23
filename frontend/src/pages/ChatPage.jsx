/**
 * ChatPage.jsx — WhatsApp-style chat, mobile-first
 * Features: fixed header, keyboard-safe layout, reply, copy,
 *           emoji picker, call log bubbles, typing indicator,
 *           read receipts, reactions, smooth scroll
 */

import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import { getStreamToken } from "../lib/api";
import {
  useState, useEffect, useRef, useCallback,
  createContext, useContext,
} from "react";
import useAuthUser from "../hooks/useAuthUser";
import ChatLoader from "../components/ChatLoader";
import {
  Channel, Chat, MessageList, Thread, Window,
  useMessageContext, useChannelStateContext,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import { useThemeStore } from "../Store/useThemeStore";
import {
  VideoIcon, PhoneIcon, ArrowLeftIcon, CopyIcon,
  SmileIcon, CheckIcon, ReplyIcon, XIcon, MicIcon,
  MoreVerticalIcon, SendIcon,
} from "lucide-react";
import Avatar from "../components/Avatar";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

/* ════════════════════════════════════════
   VIEWPORT HOOK — keyboard-aware layout
   On Android Chrome, keyboard open causes:
     - visualViewport.height shrinks → use for container height
     - visualViewport.offsetTop shifts → use for `top` position
   Together: layout NEVER moves, input always visible.
════════════════════════════════════════ */
const useViewport = () => {
  const [vp, setVp] = useState(() => ({
    height: window.visualViewport?.height ?? window.innerHeight,
    offsetTop: window.visualViewport?.offsetTop ?? 0,
  }));
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setVp({ height: vv.height, offsetTop: vv.offsetTop });
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return vp;
};

/* ════════════════════════════════════════
   CONTEXT
════════════════════════════════════════ */
const RC = createContext(null);
const useReply = () => useContext(RC);

/* ════════════════════════════════════════
   TICK ICONS
════════════════════════════════════════ */
const SingleTick = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
    <path d="M1 5L4.5 8.5L13 1" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const DoubleTick = ({ read }) => (
  <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
    <path d="M1 5.5L4.5 9L10.5 2" stroke={read ? "#53BDEB" : "rgba(255,255,255,0.5)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 5.5L10.5 9L16.5 2" stroke={read ? "#53BDEB" : "rgba(255,255,255,0.5)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ════════════════════════════════════════
   REACTIONS
════════════════════════════════════════ */
const REACTS = [
  { e: "👍", t: "like" }, { e: "❤️", t: "love" }, { e: "😂", t: "haha" },
  { e: "😮", t: "wow" }, { e: "😢", t: "sad" }, { e: "🙏", t: "pray" },
];
const T2E = Object.fromEntries(REACTS.map(({ e, t }) => [t, e]));

/* ════════════════════════════════════════
   EMOJI PICKER (lightweight inline)
════════════════════════════════════════ */
const EMOJI_GROUPS = [
  { label: "Smileys", emojis: ["😀","😂","🥹","😍","🥰","😎","🤩","😭","😤","🤔","😴","🤗","😬","🙄","😈","💀","🤡","👻","🎉","🔥"] },
  { label: "Gestures", emojis: ["👍","👎","👏","🙏","🤝","✌️","🤞","🤙","💪","🖐️","👋","🤚","✋","🫶","❤️","🧡","💛","💚","💙","💜"] },
  { label: "Objects", emojis: ["🎵","🎶","🎤","🎸","⚽","🏀","🏆","🎯","🎮","📱","💻","📷","🌍","🌙","⭐","🌈","🌊","❄️","🌸","🍕"] },
];

const EmojiPicker = ({ onSelect, onClose }) => {
  const ref = useRef(null);
  const [tab, setTab] = useState(0);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const tid = setTimeout(() => { document.addEventListener("mousedown", fn); document.addEventListener("touchstart", fn); }, 60);
    return () => { clearTimeout(tid); document.removeEventListener("mousedown", fn); document.removeEventListener("touchstart", fn); };
  }, [onClose]);
  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 z-50 rounded-2xl overflow-hidden shadow-2xl border border-[#2a3942]" style={{ background: "#1f2c34", width: 280 }}>
      <div className="flex border-b border-[#2a3942]">
        {EMOJI_GROUPS.map((g, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === i ? "text-[#00a884] border-b-2 border-[#00a884]" : "text-[#8696a0]"}`}>
            {g.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1 p-3 max-h-40 overflow-y-auto">
        {EMOJI_GROUPS[tab].emojis.map((em, i) => (
          <button key={i} onClick={() => onSelect(em)}
            className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 active:scale-90 transition-all">
            {em}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   MESSAGE CONTEXT MENU
════════════════════════════════════════ */
const MsgMenu = ({ message, isMine, onReact, onClose, onReply, myRT }) => {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const tid = setTimeout(() => {
      document.addEventListener("mousedown", fn);
      document.addEventListener("touchstart", fn);
    }, 60);
    return () => { clearTimeout(tid); document.removeEventListener("mousedown", fn); document.removeEventListener("touchstart", fn); };
  }, [onClose]);

  const copy = () => {
    navigator.clipboard?.writeText(message.text || "").then(() => {
      setCopied(true); setTimeout(onClose, 1400);
    });
  };

  return (
    <div ref={ref}
      className={`absolute z-50 bottom-full mb-2 flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-[#2a3942] min-w-[200px] ${isMine ? "right-0" : "left-0"}`}
      style={{ background: "#1f2c34" }}>
      {/* Reaction row */}
      <div className="flex items-center justify-between px-2 py-2.5 border-b border-[#2a3942]">
        {REACTS.map(({ e, t }) => (
          <button key={t} onClick={() => { onReact(t); onClose(); }}
            className={`text-[22px] w-9 h-9 flex items-center justify-center rounded-full transition-all ${myRT === t ? "bg-[#00a884]/30 scale-110" : "hover:bg-white/10 active:scale-90"}`}>
            {e}
          </button>
        ))}
      </div>
      <button onClick={() => { onReply(message); onClose(); }}
        className="flex items-center gap-3 px-4 py-3.5 text-sm text-[#e9edef] hover:bg-white/5 active:bg-white/10 transition-colors">
        <ReplyIcon className="size-4 text-[#8696a0]" />
        <span>Reply</span>
      </button>
      <button onClick={copy}
        className="flex items-center gap-3 px-4 py-3.5 text-sm text-[#e9edef] hover:bg-white/5 active:bg-white/10 transition-colors border-t border-[#2a3942]/50">
        {copied ? <CheckIcon className="size-4 text-[#00a884]" /> : <CopyIcon className="size-4 text-[#8696a0]" />}
        <span>{copied ? "Copied!" : "Copy text"}</span>
      </button>
    </div>
  );
};

/* ════════════════════════════════════════
   CALL LOG BUBBLE
════════════════════════════════════════ */
const CallLogBubble = ({ message }) => {
  const isVideo = message.call_type === "video" || message.text?.toLowerCase().includes("video");
  const dur = message.call_duration;
  const time = new Date(message.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const durStr = !dur ? "" : dur >= 60 ? `${Math.floor(dur / 60)} min ${dur % 60} sec` : `${dur} sec`;
  return (
    <div className="flex justify-end w-full px-3 mb-1">
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-[16px] rounded-tr-[4px]"
        style={{ background: "#005c4b", minWidth: 185, maxWidth: 265 }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.1)" }}>
          {isVideo
            ? <VideoIcon className="size-5" style={{ color: "rgba(255,255,255,0.7)" }} />
            : <PhoneIcon className="size-5" style={{ color: "rgba(255,255,255,0.7)" }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">{isVideo ? "Video call" : "Voice call"}</p>
          {durStr && <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{durStr}</p>}
        </div>
        <span className="text-[10px] self-end flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>{time}</span>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   CUSTOM MESSAGE BUBBLE
════════════════════════════════════════ */
const CustomMessage = () => {
  const { message, isMyMessage, handleReaction } = useMessageContext();
  const { setReplyTo } = useReply();
  const [showMenu, setShowMenu] = useState(false);
  const lpt = useRef(null);
  const isMine = isMyMessage();

  // Special message types
  if (message.call_log) return <CallLogBubble message={message} />;
  if (message.text?.includes("/call/") && message.text?.includes("started a")) return null;
  if (!message.text) return null;

  const time = new Date(message.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const isSending = message.status === "sending";
  const isRead = message.readBy && message.readBy.length > 1;
  const myRT = (message.own_reactions || [])[0]?.type || null;
  const rCounts = message.reaction_counts || {};
  const quoted = message.quoted_message || null;
  const textLen = (message.text || "").length;

  const onReact = useCallback(async (type) => {
    try {
      if (myRT && myRT !== type) { await handleReaction(myRT); await handleReaction(type); }
      else await handleReaction(type);
    } catch (e) { console.error(e); }
  }, [handleReaction, myRT]);

  const touchStart = () => { lpt.current = setTimeout(() => setShowMenu(true), 450); };
  const touchEnd = () => { clearTimeout(lpt.current); };

  // Layout: short msgs get stacked time, long msgs get inline spacer+absolute time
  const isShort = textLen <= 15;

  return (
    <div className={`flex w-full px-2 mb-[3px] ${isMine ? "justify-end" : "justify-start"}`}>
      <div className="relative group" style={{ maxWidth: "min(76%, 310px)" }}>

        {/* Desktop: hover emoji button */}
        <button onClick={() => setShowMenu(v => !v)}
          className={`hidden sm:flex absolute top-2 opacity-0 group-hover:opacity-100 z-10 transition-opacity w-7 h-7 items-center justify-center rounded-full text-[#8696a0] hover:bg-white/10 ${isMine ? "-left-8" : "-right-8"}`}>
          <SmileIcon className="size-4" />
        </button>

        {showMenu && (
          <MsgMenu message={message} isMine={isMine} myRT={myRT}
            onReact={onReact} onReply={(m) => setReplyTo(m)} onClose={() => setShowMenu(false)} />
        )}

        {/* Bubble */}
        <div
          onTouchStart={touchStart} onTouchEnd={touchEnd} onTouchMove={touchEnd}
          onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
          className={`relative px-3 pt-[7px] select-text shadow-sm
            ${isMine
              ? "bg-[#005c4b] text-white rounded-[18px] rounded-tr-[4px]"
              : "bg-[#202c33] text-[#e9edef] rounded-[18px] rounded-tl-[4px]"}`}
          style={{ wordBreak: "break-word" }}
        >
          {/* Sender name for received */}
          {!isMine && message.user?.name && (
            <p className="text-[11px] font-semibold mb-[2px] leading-tight" style={{ color: "#00a884" }}>
              {message.user.name}
            </p>
          )}

          {/* Reply quote */}
          {quoted && (
            <div className={`flex flex-col mb-[6px] px-2 py-[6px] rounded-lg text-[12px] ${isMine ? "bg-[#025144] border-l-[3px] border-[#00a884]" : "bg-[#1a2c34] border-l-[3px] border-[#00a884]"}`}>
              <span className="font-semibold truncate" style={{ color: "#00a884" }}>{quoted.user?.name || "Unknown"}</span>
              <span className="truncate mt-[2px]" style={{ color: "#8696a0" }}>{quoted.text}</span>
            </div>
          )}

          {/* Message text */}
          {isShort ? (
            /* Short: text + time stacked */
            <div className="pb-[6px]">
              <p className="text-[14.2px] leading-[1.42]">{message.text}</p>
              <div className="flex items-center justify-end gap-[3px] mt-[3px]">
                <span className="text-[10px]" style={{ color: isMine ? "rgba(255,255,255,0.48)" : "rgba(233,237,239,0.38)" }}>{time}</span>
                {isMine && (isSending ? <SingleTick /> : <DoubleTick read={isRead} />)}
              </div>
            </div>
          ) : (
            /* Long: inline spacer keeps text from under absolute time */
            <div className="pb-[18px]">
              <p className="text-[14.2px] leading-[1.42]">
                {message.text}
                <span className="inline-block" style={{ width: isMine ? "60px" : "42px" }} />
              </p>
              <div className="absolute bottom-[6px] right-[10px] flex items-center gap-[3px]">
                <span className="text-[10px]" style={{ color: isMine ? "rgba(255,255,255,0.48)" : "rgba(233,237,239,0.38)" }}>{time}</span>
                {isMine && (isSending ? <SingleTick /> : <DoubleTick read={isRead} />)}
              </div>
            </div>
          )}
        </div>

        {/* Reaction pills */}
        {Object.keys(rCounts).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
            {Object.entries(rCounts).map(([type, count]) => (
              <button key={type} onClick={() => onReact(type)}
                className={`inline-flex items-center gap-[3px] px-2 py-[3px] rounded-full text-xs border transition-all ${myRT === type ? "border-[#00a884]/50 bg-[#00a884]/15" : "border-[#2a3942] bg-[#233138] hover:bg-[#2a3942]"}`}>
                <span>{T2E[type] || "👍"}</span>
                {count > 1 && <span style={{ color: "#8696a0" }}>{count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   DATE SEPARATOR
════════════════════════════════════════ */
const DateSep = ({ date }) => {
  const d = new Date(date), now = new Date(), yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  const label = same(d, now) ? "Today" : same(d, yest) ? "Yesterday"
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <div className="flex justify-center my-4">
      <span className="px-3 py-[5px] rounded-full text-[11px] font-medium"
        style={{ background: "rgba(17,27,33,0.85)", color: "#8696a0", backdropFilter: "blur(4px)" }}>
        {label}
      </span>
    </div>
  );
};

/* ════════════════════════════════════════
   ONLINE STATUS  (needs Channel context)
════════════════════════════════════════ */
const OnlineStatus = ({ userId }) => {
  const { channel } = useChannelStateContext();
  const [online, setOnline] = useState(false);
  useEffect(() => {
    if (!channel || !userId) return;
    setOnline(channel.state?.members?.[userId]?.user?.online ?? false);
    const fn = (e) => { if (e.user?.id === userId) setOnline(e.user.online ?? false); };
    channel.on("user.presence.changed", fn);
    return () => channel.off("user.presence.changed", fn);
  }, [channel, userId]);
  return (
    <span className="text-[11px] font-normal" style={{ color: online ? "#00a884" : "#8696a0" }}>
      {online ? "online" : "offline"}
    </span>
  );
};

/* ════════════════════════════════════════
   TYPING INDICATOR
════════════════════════════════════════ */
const Typing = ({ channel, myId }) => {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (!channel) return;
    const fn = () => setTyping(Object.values(channel.state?.typing || {}).some(u => u.user?.id !== myId));
    channel.on("typing.start", fn); channel.on("typing.stop", fn);
    return () => { channel.off("typing.start", fn); channel.off("typing.stop", fn); };
  }, [channel, myId]);
  if (!typing) return null;
  return (
    <div className="flex justify-start px-3 pb-2">
      <div className="rounded-[16px] rounded-tl-[4px] px-3 py-2 flex gap-1 items-center shadow-sm" style={{ background: "#202c33" }}>
        {[0, 1, 2].map(i => (
          <span key={i} className="w-[6px] h-[6px] rounded-full" style={{ background: "#8696a0", animation: "waDot 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   REPLY PREVIEW BANNER
════════════════════════════════════════ */
const ReplyBanner = ({ replyTo, onCancel }) => {
  if (!replyTo) return null;
  return (
    <div className="flex items-start gap-2 px-3 py-[10px] border-l-[4px] border-[#00a884] mx-2 mb-1 rounded-lg" style={{ background: "#1f2c34" }}>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold truncate" style={{ color: "#00a884" }}>{replyTo.user?.name || "Unknown"}</p>
        <p className="text-[12px] truncate mt-[2px]" style={{ color: "#8696a0" }}>{replyTo.text}</p>
      </div>
      <button onClick={onCancel} className="p-1 rounded-full text-[#8696a0] hover:text-white hover:bg-white/10 transition-colors flex-shrink-0">
        <XIcon className="size-4" />
      </button>
    </div>
  );
};

/* ════════════════════════════════════════
   MESSAGE INPUT
════════════════════════════════════════ */
const MsgInput = ({ channel }) => {
  const { replyTo, setReplyTo } = useReply();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const ta = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = ta.current; if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 130) + "px";
  }, [text]);

  // Focus on reply
  useEffect(() => { if (replyTo) { setShowEmoji(false); ta.current?.focus(); } }, [replyTo]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    // Re-focus textarea BEFORE async send so keyboard never closes
    // requestAnimationFrame ensures focus happens in the same user gesture
    requestAnimationFrame(() => { ta.current?.focus(); });
    try {
      const p = { text: trimmed };
      if (replyTo) p.quoted_message_id = replyTo.id;
      await channel.sendMessage(p);
      setText(""); setReplyTo(null);
      // Re-focus again after state update to keep keyboard open
      requestAnimationFrame(() => { ta.current?.focus(); });
    } catch { toast.error("Failed to send"); }
    finally { setBusy(false); }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    channel.keystroke().catch(() => {});
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const insertEmoji = (em) => {
    setText(prev => prev + em);
    ta.current?.focus();
  };

  return (
    <div className="flex-shrink-0" style={{ background: "#0b141a" }}>
      {replyTo && <ReplyBanner replyTo={replyTo} onCancel={() => setReplyTo(null)} />}

      <div className="flex items-end gap-2 px-2 py-[10px]">
        {/* Emoji button */}
        <div className="relative flex-shrink-0">
          {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => setShowEmoji(v => !v)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 ${showEmoji ? "bg-[#00a884]/20 text-[#00a884]" : "text-[#8696a0] hover:bg-white/8"}`}>
            <SmileIcon className="size-[22px]" />
          </button>
        </div>

        {/* Text area */}
        <div className="flex-1 flex items-end rounded-[24px] px-[14px] py-[10px] min-h-[46px]"
          style={{ background: "#2a3942" }}>
          <textarea
            ref={ta}
            value={text}
            rows={1}
            onChange={handleChange}
            onKeyDown={handleKey}
            placeholder="Message"
            className="flex-1 bg-transparent resize-none outline-none leading-[1.45] max-h-[130px] overflow-y-auto"
            style={{ fontSize: "16px", color: "#e9edef" }}
            // Keep keyboard open: suppress blur when tapping send/emoji buttons
            // (those buttons use onPointerDown preventDefault, so blur won't fire from them)
          />
        </div>

        {/* Send / Mic button */}
        <div className="flex-shrink-0">
          {text.trim() ? (
            <button
              onMouseDown={(e) => e.preventDefault()} // prevent textarea blur on desktop
              onPointerDown={(e) => e.preventDefault()} // prevent textarea blur on mobile
              onClick={send}
              disabled={busy}
              className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 disabled:opacity-50 transition-all shadow-lg"
              style={{ background: "#00a884" }}>
              <SendIcon className="size-5 text-white ml-0.5" />
            </button>
          ) : (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => e.preventDefault()}
              className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all shadow-lg"
              style={{ background: "#00a884" }}>
              <MicIcon className="size-5 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   CHAT HEADER  (inside Channel context)
════════════════════════════════════════ */
const ChatHeader = ({ user, userId, onVideo, onVoice }) => {
  const navigate = useNavigate();
  const name = user?.name || user?.fullName || "Loading...";
  const avatar = user?.image || user?.profilePic;
  return (
    <div className="flex items-center gap-1 flex-shrink-0 z-20"
      style={{
        background: "#202c33",
        borderBottom: "1px solid #2a3942",
        paddingTop: "max(10px, env(safe-area-inset-top, 10px))",
        paddingBottom: "10px",
        paddingLeft: "4px",
        paddingRight: "4px",
      }}>
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="p-2 rounded-full text-[#aebac1] hover:bg-white/10 active:bg-white/20 flex-shrink-0 transition-colors">
        <ArrowLeftIcon className="size-5" />
      </button>

      {/* Avatar + Name + Status */}
      <div className="flex items-center gap-[10px] flex-1 min-w-0 py-1 px-1 rounded-xl cursor-pointer active:bg-white/5 transition-colors">
        <div className="flex-shrink-0">
          <Avatar src={avatar} alt={name} size="sm" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold truncate leading-[1.2]" style={{ color: "#e9edef" }}>{name}</p>
          {userId && <OnlineStatus userId={userId} />}
        </div>
      </div>

      {/* Call + More */}
      <div className="flex items-center flex-shrink-0">
        <button onClick={onVoice}
          className="p-[10px] rounded-full text-[#aebac1] hover:bg-white/10 active:scale-90 transition-all"
          aria-label="Voice call">
          <PhoneIcon className="size-5" />
        </button>
        <button onClick={onVideo}
          className="p-[10px] rounded-full text-[#aebac1] hover:bg-white/10 active:scale-90 transition-all"
          aria-label="Video call">
          <VideoIcon className="size-5" />
        </button>
        <button className="p-[10px] rounded-full text-[#aebac1] hover:bg-white/10 transition-colors"
          aria-label="More options">
          <MoreVerticalIcon className="size-5" />
        </button>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   CHAT INNER  (uses Channel context)
════════════════════════════════════════ */
const ChatInner = ({ channel, targetUser, targetUserId, authUserId, onVideo, onVoice }) => {
  const listRef = useRef(null);

  // Scroll to bottom — only on mount + new messages
  // DO NOT scroll on viewport/keyboard change (that causes the "jump" bug)
  const scrollBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => { setTimeout(scrollBottom, 200); }, [scrollBottom]);

  useEffect(() => {
    if (!channel) return;
    const fn = () => setTimeout(scrollBottom, 60);
    channel.on("message.new", fn);
    return () => channel.off("message.new", fn);
  }, [channel, scrollBottom]);

  return (
    <>
      <ChatHeader user={targetUser} userId={targetUserId} onVideo={onVideo} onVoice={onVoice} />

      {/* ── Messages — only this div scrolls ── */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ minHeight: 0, WebkitOverflowScrolling: "touch" }}
      >
        <MessageList />
        <Typing channel={channel} myId={authUserId} />
      </div>

      <MsgInput channel={channel} />
    </>
  );
};

/* ════════════════════════════════════════
   CHAT PAGE
════════════════════════════════════════ */
const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const navigate = useNavigate();
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const { authUser } = useAuthUser();
  const { chatBackgroundValue } = useThemeStore();
  // Track exact viewport size+offset — works on Android Chrome with keyboard
  const { height: vh, offsetTop } = useViewport();

  const { data: td } = useQuery({ queryKey: ["streamToken"], queryFn: getStreamToken, enabled: !!authUser });

  useEffect(() => {
    if (!td?.token || !authUser) return;
    (async () => {
      try {
        const c = StreamChat.getInstance(STREAM_API_KEY);
        if (c.userID !== authUser._id)
          await c.connectUser({ id: authUser._id, name: authUser.fullName, image: authUser.profilePic }, td.token);
        const { users } = await c.queryUsers({ id: { $eq: targetUserId } });
        if (users[0]) setTargetUser(users[0]);
        const ch = c.channel("messaging", [authUser._id, targetUserId].sort().join("-"), { members: [authUser._id, targetUserId] });
        await ch.watch();
        setChatClient(c); setChannel(ch);

        // ── Auto-delete messages 1 minute after friend reads them ──
        // When friend reads → schedule deletion of all MY sent messages
        ch.on("message.read", async (event) => {
          if (event.user?.id !== authUser._id) {
            // Friend read the messages — delete my sent ones after 60s
            setTimeout(async () => {
              const msgs = ch.state.messages || [];
              for (const msg of msgs) {
                if (
                  msg.user?.id === authUser._id &&
                  msg.id &&
                  !msg.deleted_at &&
                  msg.type !== "deleted"
                ) {
                  try {
                    const client2 = StreamChat.getInstance(STREAM_API_KEY);
                    await client2.deleteMessage(msg.id);
                  } catch { /* silent */ }
                }
              }
            }, 60 * 1000); // 60 seconds
          }
        });

      } catch (e) { console.error(e); toast.error("Could not connect."); }
      finally { setLoading(false); }
    })();
  }, [td, authUser, targetUserId]);

  const startCall = useCallback((type) => {
    if (!channel || !authUser) return;
    navigate(`/call/${channel.id}${type === "voice" ? "?audio=true" : ""}`);
  }, [channel, authUser, navigate]);

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <RC.Provider value={{ replyTo, setReplyTo }}>
      {/* ── Inline CSS overrides for Stream ── */}
      <style>{`
        @keyframes waDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}
        /* Strip ALL Stream default UI */
        .str-chat__channel-header,.str-chat__input-flat,.str-chat__message-input,
        .str-chat__message-notification,.str-chat__jump-to-latest-message,
        .str-chat__message-reactions-button,.str-chat__reaction-selector,
        .str-chat__message-actions-box,.str-chat__message-options,.str-chat__avatar{display:none!important}
        /* Make all Stream containers transparent + flex column */
        .str-chat,.str-chat__container,.str-chat__channel{
          height:100%!important;min-height:0!important;flex:1!important;
          background:transparent!important;display:flex!important;flex-direction:column!important;}
        .str-chat__main-panel,.str-chat__main-panel-inner{
          display:flex!important;flex-direction:column!important;
          flex:1!important;min-height:0!important;background:transparent!important;}
        /* Message list transparent, no extra padding */
        .str-chat__list,.str-chat__message-list,.str-chat__reverse-infinite-scroll{
          background:transparent!important;padding:4px 0 2px!important;}
        .str-chat__list::-webkit-scrollbar{display:none}
        /* Remove all Stream li/wrapper spacing */
        .str-chat__li,.str-chat__message-simple,.str-chat__message-simple-wrapper{
          padding:0!important;margin:0!important;background:transparent!important;}
        /* iOS font-size fix — prevents auto-zoom */
        textarea,input{font-size:16px!important;}
      `}</style>

      {/*
        ROOT FIX: Use visualViewport height in pixels.
        This is the ONLY approach that works on Android Chrome reliably.
        - 100dvh on Android = includes browser toolbar = input hidden
        - visualViewport.height = actual visible screen area
        When keyboard opens → vh shrinks → layout reflows → input stays visible
      */}
      <div
        className="flex flex-col w-full overflow-hidden"
        style={{
          height: `${vh}px`,
          background: chatBackgroundValue || "#0b141a",
          position: "fixed",
          // offsetTop accounts for Android Chrome's viewport scroll when keyboard opens
          // Without this, layout shifts down by the keyboard height
          top: `${offsetTop}px`,
          left: 0,
          right: 0,
        }}
      >
        <Chat client={chatClient}>
          <Channel channel={channel} Message={CustomMessage} DateSeparator={DateSep} returnAllReadData>
            <Window hideOnThread>
              <div className="flex flex-col h-full w-full overflow-hidden">
                <ChatInner
                  channel={channel}
                  targetUser={targetUser}
                  targetUserId={targetUserId}
                  authUserId={authUser?._id}
                  onVideo={() => startCall("video")}
                  onVoice={() => startCall("voice")}
                />
              </div>
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>
    </RC.Provider>
  );
};

export default ChatPage;