


import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import { getStreamToken } from "../lib/api";
import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import useAuthUser from "../hooks/useAuthUser";
import ChatLoader from "../components/ChatLoader";
import { Channel, Chat, MessageList, Thread, Window, useMessageContext, useChannelStateContext } from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import { useThemeStore } from "../Store/useThemeStore";
import { VideoIcon, PhoneIcon, ArrowLeftIcon, CopyIcon, SmileIcon, CheckIcon, ReplyIcon, XIcon, MicIcon, MoreVerticalIcon } from "lucide-react";
import Avatar from "../components/Avatar";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

/* — Viewport height hook: fixes keyboard pushing messages off screen — */
const useVH = () => {
  const [h, setH] = useState(() => window.visualViewport?.height ?? window.innerHeight);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const fn = () => setH(vv.height);
    vv.addEventListener("resize", fn);
    vv.addEventListener("scroll", fn);
    return () => { vv.removeEventListener("resize", fn); vv.removeEventListener("scroll", fn); };
  }, []);
  return h;
};

/* — Tick SVGs — */
const SingleTick = () => <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5L4.5 8.5L13 1" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const DoubleTick = ({ read }) => <svg width="18" height="11" viewBox="0 0 18 11" fill="none"><path d="M1 5.5L4.5 9L10.5 2" stroke={read ? "#53BDEB" : "rgba(255,255,255,0.55)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 5.5L10.5 9L16.5 2" stroke={read ? "#53BDEB" : "rgba(255,255,255,0.55)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;

/* — Reactions — */
const REACTS = [{ e: "👍", t: "like" }, { e: "❤️", t: "love" }, { e: "😂", t: "haha" }, { e: "😮", t: "wow" }, { e: "😢", t: "sad" }, { e: "🙏", t: "pray" }];
const T2E = Object.fromEntries(REACTS.map(({ e, t }) => [t, e]));

/* — Reply context — */
const RC = createContext(null);
const useReply = () => useContext(RC);

/* — Message action menu — */
const MsgMenu = ({ message, isMine, onReact, onClose, onReply, myRT }) => {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const tid = setTimeout(() => { document.addEventListener("mousedown", fn); document.addEventListener("touchstart", fn); }, 60);
    return () => { clearTimeout(tid); document.removeEventListener("mousedown", fn); document.removeEventListener("touchstart", fn); };
  }, [onClose]);
  const copy = () => {
    navigator.clipboard?.writeText(message.text || "").then(() => { setCopied(true); setTimeout(() => { setCopied(false); onClose(); }, 1200); });
  };
  return (
    <div ref={ref} className={`absolute z-50 bottom-full mb-2 flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-[#233138] border border-[#2a3942] min-w-[190px] ${isMine ? "right-0" : "left-0"}`}>
      <div className="flex items-center gap-0.5 px-2 py-2.5 border-b border-[#2a3942]">
        {REACTS.map(({ e, t }) => (
          <button key={t} onClick={() => { onReact(t); onClose(); }} className={`text-[22px] w-9 h-9 flex items-center justify-center rounded-full transition-all ${myRT === t ? "bg-white/20 scale-110" : "hover:bg-white/10 active:scale-95"}`}>{e}</button>
        ))}
      </div>
      <button onClick={() => { onReply(message); onClose(); }} className="flex items-center gap-3 px-4 py-3 text-sm text-[#e9edef] hover:bg-white/5">
        <ReplyIcon className="size-4 text-[#8696a0]" /> Reply
      </button>
      <button onClick={copy} className="flex items-center gap-3 px-4 py-3 text-sm text-[#e9edef] hover:bg-white/5">
        {copied ? <CheckIcon className="size-4 text-[#00a884]" /> : <CopyIcon className="size-4 text-[#8696a0]" />}
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
};

/* — Call log bubble (WhatsApp style) — */
const CallLogBubble = ({ message }) => {
  const isVideo = message.text?.includes("video");
  const dur = message.call_duration;
  const time = new Date(message.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const durStr = dur ? (dur >= 60 ? `${Math.floor(dur / 60)} min ${dur % 60} sec` : `${dur} sec`) : "";
  return (
    <div className="flex justify-end w-full px-2 mb-1">
      <div className="bg-[#005c4b] rounded-[18px] rounded-tr-[4px] px-3 py-2.5 flex items-center gap-3 min-w-[180px] max-w-[260px]">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          {isVideo ? <VideoIcon className="size-5 text-white/70" /> : <PhoneIcon className="size-5 text-white/70" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[14px]">{isVideo ? "Video call" : "Voice call"}</p>
          {durStr && <p className="text-white/50 text-[11px]">{durStr}</p>}
        </div>
        <span className="text-[10px] text-white/40 self-end shrink-0">{time}</span>
      </div>
    </div>
  );
};

/* — Custom message bubble — FIXED alignment — */
const CustomMessage = () => {
  const { message, isMyMessage, handleReaction } = useMessageContext();
  const { setReplyTo } = useReply();
  const [showMenu, setShowMenu] = useState(false);
  const lpt = useRef(null);
  const isMine = isMyMessage();

  // Show call log bubble for call messages
  if (message.call_log) return <CallLogBubble message={message} />;
  // Hide any raw call link text messages
  if (message.text?.includes("/call/") && message.text?.includes("started a")) return null;

  const time = new Date(message.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const isSending = message.status === "sending";
  const isRead = message.readBy && message.readBy.length > 1;
  const ownR = message.own_reactions || [];
  const myRT = ownR.length > 0 ? ownR[0].type : null;
  const rCounts = message.reaction_counts || {};
  const hasR = Object.keys(rCounts).length > 0;
  const quoted = message.quoted_message || null;

  const onReact = useCallback(async (type) => {
    try {
      if (myRT && myRT !== type) { await handleReaction(myRT); await handleReaction(type); }
      else await handleReaction(type);
    } catch (e) { console.error(e); }
  }, [handleReaction, myRT]);

  // Time string width estimation for inline vs block layout
  const msgLen = (message.text || "").length;
  const tickW = isMine ? 22 : 0;
  const timeStr = time.length; // ~7-8 chars
  // Use block (separate line) for short messages to avoid overlap
  const isShort = msgLen < 12;

  return (
    <div className={`flex w-full mb-1 px-2 ${isMine ? "justify-end" : "justify-start"}`}>
      <div className="relative group" style={{ maxWidth: "min(78%, 320px)" }}>
        {/* Desktop hover */}
        <button onClick={() => setShowMenu(v => !v)}
          className={`hidden sm:flex absolute top-1 opacity-0 group-hover:opacity-100 z-10 transition-opacity items-center justify-center w-7 h-7 rounded-full text-[#8696a0] hover:bg-white/10 ${isMine ? "-left-8" : "-right-8"}`}>
          <SmileIcon className="size-4" />
        </button>

        {showMenu && <MsgMenu message={message} isMine={isMine} myRT={myRT} onReact={onReact} onReply={(m) => setReplyTo(m)} onClose={() => setShowMenu(false)} />}

        {/* Bubble — KEY FIX: use inline-block and padding-right for time space */}
        <div
          onTouchStart={() => { lpt.current = setTimeout(() => setShowMenu(true), 450); }}
          onTouchEnd={() => clearTimeout(lpt.current)}
          onTouchMove={() => clearTimeout(lpt.current)}
          onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
          className={`relative inline-block px-3 pt-2 shadow-sm select-text w-full
            ${isMine ? "bg-[#005c4b] text-white rounded-[18px] rounded-tr-[4px]" : "bg-[#202c33] text-[#e9edef] rounded-[18px] rounded-tl-[4px]"}`}
          style={{ wordBreak: "break-word" }}
        >
          {/* Sender name */}
          {!isMine && message.user?.name && (
            <p className="text-[11px] font-semibold text-[#00a884] mb-0.5 leading-tight">{message.user.name}</p>
          )}
          {/* Reply quote */}
          {quoted && (
            <div className={`flex flex-col mb-1.5 px-2 py-1.5 rounded-lg text-[12px] ${isMine ? "bg-[#025144] border-l-[3px] border-[#00a884]" : "bg-[#182d34] border-l-[3px] border-[#00a884]"}`}>
              <span className="font-semibold text-[#00a884] truncate">{quoted.user?.name || "Unknown"}</span>
              <span className="text-[#8696a0] truncate mt-0.5">{quoted.text}</span>
            </div>
          )}
          {/* Message text + time on same row for long msgs, separate for short */}
          {isShort ? (
            /* Short message: text and time/tick on separate rows */
            <div className="pb-1">
              <p className="text-[14.5px] leading-[1.45]">{message.text}</p>
              <div className={`flex items-center gap-0.5 mt-0.5 ${isMine ? "justify-end" : "justify-end"}`}>
                <span className="text-[10px]" style={{ color: isMine ? "rgba(255,255,255,0.5)" : "rgba(233,237,239,0.4)" }}>{time}</span>
                {isMine && (isSending ? <SingleTick /> : <DoubleTick read={isRead} />)}
              </div>
            </div>
          ) : (
            /* Long message: time floats to bottom-right with padding */
            <div className="pb-1">
              <p className="text-[14.5px] leading-[1.45]">
                {message.text}
                {/* Invisible spacer so text doesn't go under time */}
                <span className="inline-block" style={{ width: isMine ? "56px" : "40px" }}>&nbsp;</span>
              </p>
              <div className="absolute bottom-1.5 right-2.5 flex items-center gap-0.5">
                <span className="text-[10px]" style={{ color: isMine ? "rgba(255,255,255,0.5)" : "rgba(233,237,239,0.4)" }}>{time}</span>
                {isMine && (isSending ? <SingleTick /> : <DoubleTick read={isRead} />)}
              </div>
            </div>
          )}
        </div>

        {/* Reaction pills */}
        {hasR && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
            {Object.entries(rCounts).map(([type, count]) => (
              <button key={type} onClick={() => onReact(type)}
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border transition-all ${myRT === type ? "bg-[#00a884]/20 border-[#00a884]/50" : "bg-[#233138] border-[#2a3942]"}`}>
                <span>{T2E[type] || "👍"}</span>
                {count > 1 && <span className="text-[#8696a0]">{count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* — Date separator — */
const DateSep = ({ date }) => {
  const d = new Date(date), now = new Date(), yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  const label = same(d, now) ? "Today" : same(d, yest) ? "Yesterday" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return <div className="flex justify-center my-3"><span className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#182229]/90 text-[#8696a0]">{label}</span></div>;
};

/* — Online status — */
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
  return <span className="text-xs" style={{ color: online ? "#00a884" : "#8696a0" }}>{online ? "online" : "offline"}</span>;
};

/* — Typing indicator — */
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
    <div className="flex justify-start px-3 pb-1">
      <div className="bg-[#202c33] rounded-[18px] rounded-tl-[4px] px-3 py-2 flex gap-1 items-center">
        {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#8696a0]" style={{ animation: "tb 1.2s infinite", animationDelay: `${i * 0.2}s` }} />)}
      </div>
    </div>
  );
};

/* — Reply banner — */
const ReplyBanner = ({ replyTo, onCancel }) => {
  if (!replyTo) return null;
  return (
    <div className="flex items-start gap-2 px-3 py-2 bg-[#1f2c34] border-l-4 border-[#00a884] mx-2 mb-1 rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-[#00a884] truncate">{replyTo.user?.name || "Unknown"}</p>
        <p className="text-[12px] text-[#8696a0] truncate">{replyTo.text}</p>
      </div>
      <button onClick={onCancel} className="p-1 rounded-full hover:bg-white/10 text-[#8696a0]"><XIcon className="size-4" /></button>
    </div>
  );
};

/* — Message input — */
const MsgInput = ({ channel }) => {
  const { replyTo, setReplyTo } = useReply();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const ta = useRef(null);

  useEffect(() => {
    const el = ta.current; if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [text]);

  useEffect(() => { if (replyTo) ta.current?.focus(); }, [replyTo]);

  const send = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const p = { text: text.trim() };
      if (replyTo) p.quoted_message_id = replyTo.id;
      await channel.sendMessage(p);
      setText(""); setReplyTo(null);
    } catch { toast.error("Failed to send"); }
    finally { setBusy(false); }
  };

  return (
    <div className="shrink-0 bg-[#0b141a]" style={{ paddingBottom: "env(safe-area-inset-bottom,0px)" }}>
      {replyTo && <ReplyBanner replyTo={replyTo} onCancel={() => setReplyTo(null)} />}
      <div className="flex items-end gap-2 px-2 py-2">
        <button className="w-9 h-9 flex items-center justify-center text-[#8696a0] mb-0.5"><SmileIcon className="size-5" /></button>
        <div className="flex-1 bg-[#2a3942] rounded-[22px] flex items-end px-3 py-2 min-h-[44px]">
          <textarea ref={ta} value={text} rows={1}
            onChange={e => { setText(e.target.value); channel.keystroke().catch(() => {}); }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message"
            className="flex-1 bg-transparent text-[#e9edef] placeholder-[#8696a0] resize-none outline-none leading-[1.4] max-h-[120px]"
            style={{ fontSize: "16px" }}
          />
        </div>
        <div className="mb-0.5">
          {text.trim()
            ? <button onClick={send} disabled={busy} className="w-11 h-11 bg-[#00a884] rounded-full flex items-center justify-center active:scale-90 disabled:opacity-60">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="white"/></svg>
              </button>
            : <button className="w-11 h-11 bg-[#00a884] rounded-full flex items-center justify-center active:scale-90"><MicIcon className="size-5 text-white" /></button>
          }
        </div>
      </div>
    </div>
  );
};

/* — Header — */
const Header = ({ user, userId, onVideo, onVoice }) => {
  const navigate = useNavigate();
  const name = user?.name || user?.fullName || "Loading...";
  return (
    <div className="flex items-center gap-1 px-1 bg-[#202c33] border-b border-[#2a3942] shrink-0" style={{ paddingTop: "max(8px,env(safe-area-inset-top))", paddingBottom: "8px" }}>
      <button onClick={() => navigate(-1)} className="p-2 rounded-full text-[#aebac1] hover:bg-white/10"><ArrowLeftIcon className="size-5" /></button>
      <div className="flex items-center gap-2.5 flex-1 min-w-0 px-1 py-0.5">
        <Avatar src={user?.image || user?.profilePic} alt={name} size="sm" className="shrink-0" />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-[#e9edef] truncate leading-tight">{name}</p>
          {userId && <OnlineStatus userId={userId} />}
        </div>
      </div>
      <div className="flex items-center shrink-0">
        <button onClick={onVoice} className="p-2.5 rounded-full text-[#aebac1] hover:bg-white/10 active:scale-90"><PhoneIcon className="size-5" /></button>
        <button onClick={onVideo} className="p-2.5 rounded-full text-[#aebac1] hover:bg-white/10 active:scale-90"><VideoIcon className="size-5" /></button>
        <button className="p-2.5 rounded-full text-[#aebac1] hover:bg-white/10"><MoreVerticalIcon className="size-5" /></button>
      </div>
    </div>
  );
};

/* ═══════════════ ChatPage ═══════════════ */
const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const { authUser } = useAuthUser();
  const { chatBackgroundValue } = useThemeStore();
  const vh = useVH();
  const listRef = useRef(null);

  const { data: td } = useQuery({ queryKey: ["streamToken"], queryFn: getStreamToken, enabled: !!authUser });

  useEffect(() => {
    if (!td?.token || !authUser) return;
    (async () => {
      try {
        const c = StreamChat.getInstance(STREAM_API_KEY);
        if (c.userID !== authUser._id) await c.connectUser({ id: authUser._id, name: authUser.fullName, image: authUser.profilePic }, td.token);
        const { users } = await c.queryUsers({ id: { $eq: targetUserId } });
        if (users[0]) setTargetUser(users[0]);
        const ch = c.channel("messaging", [authUser._id, targetUserId].sort().join("-"), { members: [authUser._id, targetUserId] });
        await ch.watch();
        setClient(c); setChannel(ch);
      } catch (e) { console.error(e); toast.error("Could not connect."); }
      finally { setLoading(false); }
    })();
  }, [td, authUser, targetUserId]);

  // Scroll to bottom when keyboard opens/closes
  useEffect(() => {
    if (listRef.current) setTimeout(() => { listRef.current.scrollTop = listRef.current.scrollHeight; }, 80);
  }, [vh]);

  const startCall = useCallback((type) => {
    if (!channel || !authUser) return;
    navigate(`/call/${channel.id}${type === "voice" ? "?audio=true" : ""}`);
  }, [channel, authUser, navigate]);

  if (loading || !client || !channel) return <ChatLoader />;

  return (
    <RC.Provider value={{ replyTo, setReplyTo }}>
      <style>{`
        @keyframes tb { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-4px);opacity:1} }
        .str-chat__channel-header,.str-chat__input-flat,.str-chat__message-input{display:none!important}
        .str-chat,.str-chat__container{height:100%!important;background:transparent!important}
        .str-chat__main-panel{display:flex!important;flex-direction:column!important;height:100%!important;min-height:0!important}
        .str-chat__main-panel-inner{display:flex!important;flex-direction:column!important;flex:1!important;min-height:0!important}
        .str-chat__list,.str-chat__message-list{flex:1 1 auto!important;overflow-y:auto!important;overscroll-behavior:contain!important;background:transparent!important;padding:8px 0!important}
        .str-chat__li{padding:0!important;margin:0!important}
        .str-chat__message-reactions-button,.str-chat__reaction-selector,.str-chat__message-actions-box{display:none!important}
      `}</style>
      <div className="flex flex-col overflow-hidden" style={{ height: `${vh}px`, background: chatBackgroundValue || "#0b141a" }}>
        <Chat client={client}>
          <Channel channel={channel} Message={CustomMessage} DateSeparator={DateSep} returnAllReadData>
            <Window>
              <div className="flex flex-col h-full">
                <Header user={targetUser} userId={targetUserId} onVideo={() => startCall("video")} onVoice={() => startCall("voice")} />
                <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain" style={{ minHeight: 0 }}>
                  <MessageList />
                  <Typing channel={channel} myId={authUser?._id} />
                </div>
                <MsgInput channel={channel} />
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