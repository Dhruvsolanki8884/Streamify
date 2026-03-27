// import { useQuery } from "@tanstack/react-query";
// import { useParams, useNavigate } from "react-router";
// import { getStreamToken } from "../lib/api";
// import {
//   useState, useEffect, useRef, useCallback,
//   createContext, useContext,
// } from "react";
// import useAuthUser from "../hooks/useAuthUser";
// import ChatLoader from "../components/ChatLoader";
// import {
//   Channel, Chat, MessageList, Thread, Window,
//   useMessageContext, useChannelStateContext,
// } from "stream-chat-react";
// import { StreamChat } from "stream-chat";
// import toast from "react-hot-toast";
// import { useThemeStore } from "../Store/useThemeStore";
// import {
//   VideoIcon, PhoneIcon, ArrowLeftIcon, CopyIcon,
//   SmileIcon, CheckIcon, ReplyIcon, XIcon, MicIcon,
//   MoreVerticalIcon, SendIcon,
// } from "lucide-react";
// import Avatar from "../components/Avatar";

// const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

// const useViewport = () => {
//   const [vp, setVp] = useState(() => ({
//     height: window.visualViewport?.height ?? window.innerHeight,
//     offsetTop: window.visualViewport?.offsetTop ?? 0,
//   }));
//   useEffect(() => {
//     const vv = window.visualViewport;
//     if (!vv) return;
//     const update = () => setVp({ height: vv.height, offsetTop: vv.offsetTop });
//     vv.addEventListener("resize", update);
//     vv.addEventListener("scroll", update);
//     return () => {
//       vv.removeEventListener("resize", update);
//       vv.removeEventListener("scroll", update);
//     };
//   }, []);
//   return vp;
// };
// /* ════════════════════════════════════════
//    CONTEXT
// ════════════════════════════════════════ */
// const RC = createContext(null);
// const useReply = () => useContext(RC);

// /* ════════════════════════════════════════
//    TICK ICONS
// ════════════════════════════════════════ */
// const SingleTick = () => (
//   <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
//     <path d="M1 5L4.5 8.5L13 1" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
//   </svg>
// );
// const DoubleTick = ({ read }) => (
//   <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
//     <path d="M1 5.5L4.5 9L10.5 2" stroke={read ? "#53BDEB" : "rgba(255,255,255,0.5)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
//     <path d="M7 5.5L10.5 9L16.5 2" stroke={read ? "#53BDEB" : "rgba(255,255,255,0.5)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
//   </svg>
// );
// /* ════════════════════════════════════════
//    REACTIONS
// ════════════════════════════════════════ */
// const REACTS = [
//   { e: "👍", t: "like" }, { e: "❤️", t: "love" }, { e: "😂", t: "haha" },
//   { e: "😮", t: "wow" }, { e: "😢", t: "sad" }, { e: "🙏", t: "pray" },
// ];
// const T2E = Object.fromEntries(REACTS.map(({ e, t }) => [t, e]));

// /* ════════════════════════════════════════
//    EMOJI PICKER (lightweight inline)
// ════════════════════════════════════════ */
// const EMOJI_GROUPS = [
//   { label: "Smileys", emojis: ["😀","😂","🥹","😍","🥰","😎","🤩","😭","😤","🤔","😴","🤗","😬","🙄","😈","💀","🤡","👻","🎉","🔥"] },
//   { label: "Gestures", emojis: ["👍","👎","👏","🙏","🤝","✌️","🤞","🤙","💪","🖐️","👋","🤚","✋","🫶","❤️","🧡","💛","💚","💙","💜"] },
//   { label: "Objects", emojis: ["🎵","🎶","🎤","🎸","⚽","🏀","🏆","🎯","🎮","📱","💻","📷","🌍","🌙","⭐","🌈","🌊","❄️","🌸","🍕"] },
// ];

// const EmojiPicker = ({ onSelect, onClose }) => {
//   const ref = useRef(null);
//   const [tab, setTab] = useState(0);
//   useEffect(() => {
//     const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
//     const tid = setTimeout(() => { document.addEventListener("mousedown", fn); document.addEventListener("touchstart", fn); }, 60);
//     return () => { clearTimeout(tid); document.removeEventListener("mousedown", fn); document.removeEventListener("touchstart", fn); };
//   }, [onClose]);
//   return (
//     <div ref={ref} className="absolute bottom-full left-0 mb-2 z-50 rounded-2xl overflow-hidden shadow-2xl border border-[#2a3942]" style={{ background: "#1f2c34", width: 280 }}>
//       <div className="flex border-b border-[#2a3942]">
//         {EMOJI_GROUPS.map((g, i) => (
//           <button key={i} onClick={() => setTab(i)}
//             className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === i ? "text-[#00a884] border-b-2 border-[#00a884]" : "text-[#8696a0]"}`}>
//             {g.label}
//           </button>
//         ))}
//       </div>
//       <div className="grid grid-cols-5 gap-1 p-3 max-h-40 overflow-y-auto">
//         {EMOJI_GROUPS[tab].emojis.map((em, i) => (
//           <button key={i} onClick={() => onSelect(em)}
//             className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 active:scale-90 transition-all">
//             {em}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// };
// /* ════════════════════════════════════════
//    MESSAGE CONTEXT MENU
// ════════════════════════════════════════ */
// const MsgMenu = ({ message, isMine, onReact, onClose, onReply, myRT }) => {
//   const ref = useRef(null);
//   const [copied, setCopied] = useState(false);
//   useEffect(() => {
//     const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
//     const tid = setTimeout(() => {
//       document.addEventListener("mousedown", fn);
//       document.addEventListener("touchstart", fn);
//     }, 60);
//     return () => { clearTimeout(tid); document.removeEventListener("mousedown", fn); document.removeEventListener("touchstart", fn); };
//   }, [onClose]);

//   const copy = () => {
//     navigator.clipboard?.writeText(message.text || "").then(() => {
//       setCopied(true); setTimeout(onClose, 1400);
//     });
//   };

//   return (
//     <div ref={ref}
//       className={`absolute z-50 bottom-full mb-2 flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-[#2a3942] min-w-[200px] ${isMine ? "right-0" : "left-0"}`}
//       style={{ background: "#1f2c34" }}>
//       {/* Reaction row */}
//       <div className="flex items-center justify-between px-2 py-2.5 border-b border-[#2a3942]">
//         {REACTS.map(({ e, t }) => (
//           <button key={t} onClick={() => { onReact(t); onClose(); }}
//             className={`text-[22px] w-9 h-9 flex items-center justify-center rounded-full transition-all ${myRT === t ? "bg-[#00a884]/30 scale-110" : "hover:bg-white/10 active:scale-90"}`}>
//             {e}
//           </button>
//         ))}
//       </div>
//       <button onClick={() => { onReply(message); onClose(); }}
//         className="flex items-center gap-3 px-4 py-3.5 text-sm text-[#e9edef] hover:bg-white/5 active:bg-white/10 transition-colors">
//         <ReplyIcon className="size-4 text-[#8696a0]" />
//         <span>Reply</span>
//       </button>
//       <button onClick={copy}
//         className="flex items-center gap-3 px-4 py-3.5 text-sm text-[#e9edef] hover:bg-white/5 active:bg-white/10 transition-colors border-t border-[#2a3942]/50">
//         {copied ? <CheckIcon className="size-4 text-[#00a884]" /> : <CopyIcon className="size-4 text-[#8696a0]" />}
//         <span>{copied ? "Copied!" : "Copy text"}</span>
//       </button>
//     </div>
//   );
// };

// /* ════════════════════════════════════════
//    CALL LOG BUBBLE
// ════════════════════════════════════════ */
// const CallLogBubble = ({ message }) => {
//   const { isMyMessage } = useMessageContext();
//   const isMine = isMyMessage();
//   const isVideo = message.call_type === "video" || message.text?.toLowerCase().includes("video");
//   const isMissed = message.call_missed === true || message.text?.toLowerCase() === "missed call";
//   const dur = message.call_duration;
//   const time = new Date(message.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

//   // Format duration
//   let durStr = "";
//   if (dur > 0) {
//     const h = Math.floor(dur / 3600);
//     const m = Math.floor((dur % 3600) / 60);
//     const s = dur % 60;
//     if (h > 0) durStr = `${h}h ${m}m ${s}s`;
//     else if (m > 0) durStr = `${m} min ${s} sec`;
//     else durStr = `${s} sec`;
//   }

//   // Label
//   const direction = message.call_direction;
//   const isOutgoing = direction ? direction === "outgoing" : isMine;

//   let label, iconColor, bubbleBg;
//   if (isMissed) {
//     label = "Missed call";
//     iconColor = "#ef4444";
//     bubbleBg = isMine ? "#1a1a2e" : "#1a1a2e";
//   } else if (isOutgoing) {
//     label = isVideo ? "Outgoing video call" : "Outgoing voice call";
//     iconColor = "rgba(255,255,255,0.7)";
//     bubbleBg = isMine ? "#005c4b" : "#202c33";
//   } else {
//     label = isVideo ? "Incoming video call" : "Incoming voice call";
//     iconColor = "rgba(255,255,255,0.7)";
//     bubbleBg = isMine ? "#005c4b" : "#202c33";
//   }

//   return (
//     <div className={`flex w-full px-3 mb-1 ${isMine ? "justify-end" : "justify-start"}`}>
//       <div
//         className="flex items-center gap-3 px-3 py-2.5"
//         style={{
//           background: bubbleBg,
//           borderRadius: isMine ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
//           minWidth: 185,
//           maxWidth: 265,
//           border: isMissed ? "1px solid rgba(239,68,68,0.3)" : "none",
//         }}
//       >
//         <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
//           style={{ background: isMissed ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.1)" }}>
//           {isVideo
//             ? <VideoIcon className="size-5" style={{ color: iconColor }} />
//             : <PhoneIcon className="size-5" style={{ color: iconColor }} />}
//         </div>
//         <div className="flex-1 min-w-0">
//           {/* Missed call label in RED */}
//           <p className="font-semibold text-sm" style={{ color: isMissed ? "#ef4444" : "white" }}>
//             {label}
//           </p>
//           {durStr
//             ? <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{durStr}</p>
//             : isMissed
//               ? null
//               : <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>No answer</p>}
//         </div>
//         <span className="text-[10px] self-end flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>{time}</span>
//       </div>
//     </div>
//   );
// };

// /* ════════════════════════════════════════
//    CUSTOM MESSAGE BUBBLE
// ════════════════════════════════════════ */
// const CustomMessage = () => {
//   const { message, isMyMessage, handleReaction } = useMessageContext();
//   const { setReplyTo } = useReply();
//   const [showMenu, setShowMenu] = useState(false);
//   const lpt = useRef(null);
//   const isMine = isMyMessage();

//   // Special message types
//   if (message.call_log) return <CallLogBubble message={message} />;
//   if (message.text?.includes("/call/") && message.text?.includes("started a")) return null;
//   // Hide deleted messages entirely — no "This message was deleted" text
//   if (message.type === "deleted" || message.deleted_at) return null;
//   if (!message.text) return null;

//   const time = new Date(message.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
//   const isSending = message.status === "sending";
//   const isRead = message.readBy && message.readBy.length > 1;
//   const myRT = (message.own_reactions || [])[0]?.type || null;
//   const rCounts = message.reaction_counts || {};
//   const quoted = message.quoted_message || null;
//   const textLen = (message.text || "").length;

//   const onReact = useCallback(async (type) => {
//     try {
//       if (myRT && myRT !== type) { await handleReaction(myRT); await handleReaction(type); }
//       else await handleReaction(type);
//     } catch (e) { console.error(e); }
//   }, [handleReaction, myRT]);

//   const touchStart = () => { lpt.current = setTimeout(() => setShowMenu(true), 450); };
//   const touchEnd = () => { clearTimeout(lpt.current); };

//   // Layout: short msgs get stacked time, long msgs get inline spacer+absolute time
//   const isShort = textLen <= 15;

//   return (
//     <div className={`flex w-full px-2 mb-[3px] ${isMine ? "justify-end" : "justify-start"}`}>
//       <div className="relative group" style={{ maxWidth: "min(76%, 310px)" }}>

//         {/* Desktop: hover emoji button */}
//         <button onClick={() => setShowMenu(v => !v)}
//           className={`hidden sm:flex absolute top-2 opacity-0 group-hover:opacity-100 z-10 transition-opacity w-7 h-7 items-center justify-center rounded-full text-[#8696a0] hover:bg-white/10 ${isMine ? "-left-8" : "-right-8"}`}>
//           <SmileIcon className="size-4" />
//         </button>

//         {showMenu && (
//           <MsgMenu message={message} isMine={isMine} myRT={myRT}
//             onReact={onReact} onReply={(m) => setReplyTo(m)} onClose={() => setShowMenu(false)} />
//         )}

//         {/* Bubble */}
//         <div
//           onTouchStart={touchStart} onTouchEnd={touchEnd} onTouchMove={touchEnd}
//           onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
//           className={`relative px-3 pt-[7px] select-text shadow-sm
//             ${isMine
//               ? "bg-[#005c4b] text-white rounded-[18px] rounded-tr-[4px]"
//               : "bg-[#202c33] text-[#e9edef] rounded-[18px] rounded-tl-[4px]"}`}
//           style={{ wordBreak: "break-word" }}
//         >
//           {/* Sender name for received */}
//           {!isMine && message.user?.name && (
//             <p className="text-[11px] font-semibold mb-[2px] leading-tight" style={{ color: "#00a884" }}>
//               {message.user.name}
//             </p>
//           )}

//           {/* Reply quote */}
//           {quoted && (
//             <div className={`flex flex-col mb-[6px] px-2 py-[6px] rounded-lg text-[12px] ${isMine ? "bg-[#025144] border-l-[3px] border-[#00a884]" : "bg-[#1a2c34] border-l-[3px] border-[#00a884]"}`}>
//               <span className="font-semibold truncate" style={{ color: "#00a884" }}>{quoted.user?.name || "Unknown"}</span>
//               <span className="truncate mt-[2px]" style={{ color: "#8696a0" }}>{quoted.text}</span>
//             </div>
//           )}

//           {/* Message text */}
//           {isShort ? (
//             /* Short: text + time stacked */
//             <div className="pb-[6px]">
//               <p className="text-[14.2px] leading-[1.42]">{message.text}</p>
//               <div className="flex items-center justify-end gap-[3px] mt-[3px]">
//                 <span className="text-[10px]" style={{ color: isMine ? "rgba(255,255,255,0.48)" : "rgba(233,237,239,0.38)" }}>{time}</span>
//                 {isMine && (isSending ? <SingleTick /> : <DoubleTick read={isRead} />)}
//               </div>
//             </div>
//           ) : (
//             /* Long: inline spacer keeps text from under absolute time */
//             <div className="pb-[18px]">
//               <p className="text-[14.2px] leading-[1.42]">
//                 {message.text}
//                 <span className="inline-block" style={{ width: isMine ? "60px" : "42px" }} />
//               </p>
//               <div className="absolute bottom-[6px] right-[10px] flex items-center gap-[3px]">
//                 <span className="text-[10px]" style={{ color: isMine ? "rgba(255,255,255,0.48)" : "rgba(233,237,239,0.38)" }}>{time}</span>
//                 {isMine && (isSending ? <SingleTick /> : <DoubleTick read={isRead} />)}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Reaction pills */}
//         {Object.keys(rCounts).length > 0 && (
//           <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
//             {Object.entries(rCounts).map(([type, count]) => (
//               <button key={type} onClick={() => onReact(type)}
//                 className={`inline-flex items-center gap-[3px] px-2 py-[3px] rounded-full text-xs border transition-all ${myRT === type ? "border-[#00a884]/50 bg-[#00a884]/15" : "border-[#2a3942] bg-[#233138] hover:bg-[#2a3942]"}`}>
//                 <span>{T2E[type] || "👍"}</span>
//                 {count > 1 && <span style={{ color: "#8696a0" }}>{count}</span>}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
// /* ════════════════════════════════════════
//    DATE SEPARATOR
// ════════════════════════════════════════ */
// const DateSep = ({ date }) => {
//   const d = new Date(date), now = new Date(), yest = new Date(now);
//   yest.setDate(now.getDate() - 1);
//   const same = (a, b) => a.toDateString() === b.toDateString();
//   const label = same(d, now) ? "Today" : same(d, yest) ? "Yesterday"
//     : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
//   return (
//     <div className="flex justify-center my-4">
//       <span className="px-3 py-[5px] rounded-full text-[11px] font-medium"
//         style={{ background: "rgba(17,27,33,0.85)", color: "#8696a0", backdropFilter: "blur(4px)" }}>
//         {label}
//       </span>
//     </div>
//   );
// };

// /* ════════════════════════════════════════
//    ONLINE STATUS  (needs Channel context)
//    Shows "typing..." when peer is typing — WhatsApp style
// ════════════════════════════════════════ */
// const OnlineStatus = ({ userId, myId }) => {
//   const { channel } = useChannelStateContext();
//   const [online, setOnline] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);

//   useEffect(() => {
//     if (!channel || !userId) return;
//     setOnline(channel.state?.members?.[userId]?.user?.online ?? false);
//     const onPresence = (e) => { if (e.user?.id === userId) setOnline(e.user.online ?? false); };
//     channel.on("user.presence.changed", onPresence);
//     return () => channel.off("user.presence.changed", onPresence);
//   }, [channel, userId]);

//   useEffect(() => {
//     if (!channel || !myId) return;
//     const fn = () => {
//       const typingUsers = Object.values(channel.state?.typing || {});
//       setIsTyping(typingUsers.some(u => u.user?.id !== myId));
//     };
//     channel.on("typing.start", fn);
//     channel.on("typing.stop", fn);
//     return () => { channel.off("typing.start", fn); channel.off("typing.stop", fn); };
//   }, [channel, myId]);

//   if (isTyping) {
//     return (
//       <span className="text-[11px] font-normal flex items-center gap-1" style={{ color: "#00a884" }}>
//         typing...
//       </span>
//     );
//   }
//   return (
//     <span className="text-[11px] font-normal" style={{ color: online ? "#00a884" : "#8696a0" }}>
//       {online ? "online" : "offline"}
//     </span>
//   );
// };

// /* ════════════════════════════════════════
//    TYPING INDICATOR
// ════════════════════════════════════════ */
// const Typing = ({ channel, myId }) => {
//   const [typing, setTyping] = useState(false);
//   useEffect(() => {
//     if (!channel) return;
//     const fn = () => setTyping(Object.values(channel.state?.typing || {}).some(u => u.user?.id !== myId));
//     channel.on("typing.start", fn); channel.on("typing.stop", fn);
//     return () => { channel.off("typing.start", fn); channel.off("typing.stop", fn); };
//   }, [channel, myId]);
//   if (!typing) return null;
//   return (
//     <div className="flex justify-start px-3 pb-2">
//       <div className="rounded-[16px] rounded-tl-[4px] px-3 py-2 flex gap-1 items-center shadow-sm" style={{ background: "#202c33" }}>
//         {[0, 1, 2].map(i => (
//           <span key={i} className="w-[6px] h-[6px] rounded-full" style={{ background: "#c1ccd3ff", animation: "waDot 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
//         ))}
//       </div>
//     </div>
//   );
// };

// /* ════════════════════════════════════════
//    REPLY PREVIEW BANNER
// ════════════════════════════════════════ */
// const ReplyBanner = ({ replyTo, onCancel }) => {
//   if (!replyTo) return null;
//   return (
//     <div className="flex items-start gap-2 px-3 py-[10px] border-l-[4px] border-[#00a884] mx-2 mb-1 rounded-lg" style={{ background: "#1f2c34" }}>
//       <div className="flex-1 min-w-0">
//         <p className="text-[11px] font-semibold truncate" style={{ color: "#00a884" }}>{replyTo.user?.name || "Unknown"}</p>
//         <p className="text-[12px] truncate mt-[2px]" style={{ color: "#8696a0" }}>{replyTo.text}</p>
//       </div>
//       <button onClick={onCancel} className="p-1 rounded-full text-[#8696a0] hover:text-white hover:bg-white/10 transition-colors flex-shrink-0">
//         <XIcon className="size-4" />
//       </button>
//     </div>
//   );
// };
// /* ════════════════════════════════════════
//    MESSAGE INPUT
// ════════════════════════════════════════ */
// const MsgInput = ({ channel }) => {
//   const { replyTo, setReplyTo } = useReply();
//   const [text, setText] = useState("");
//   const [busy, setBusy] = useState(false);
//   const [showEmoji, setShowEmoji] = useState(false);
//   const ta = useRef(null);

//   // Auto-resize textarea
//   useEffect(() => {
//     const el = ta.current; if (!el) return;
//     el.style.height = "auto";
//     el.style.height = Math.min(el.scrollHeight, 130) + "px";
//   }, [text]);
//   // Focus on reply
//   useEffect(() => { if (replyTo) { setShowEmoji(false); ta.current?.focus(); } }, [replyTo]);
//   const send = async () => {
//     const trimmed = text.trim();
//     if (!trimmed || busy) return;
//     setBusy(true)
//     requestAnimationFrame(() => { ta.current?.focus(); });
//     try {
//       const p = { text: trimmed };
//       if (replyTo) p.quoted_message_id = replyTo.id;
//       await channel.sendMessage(p);
//       setText(""); setReplyTo(null);
//       // Re-focus again after state update to keep keyboard open
//       requestAnimationFrame(() => { ta.current?.focus(); });
//     } catch { toast.error("Failed to send"); }
//     finally { setBusy(false); }
//   };
//   const handleChange = (e) => {
//     setText(e.target.value);
//     channel.keystroke().catch(() => {});
//   };

//   const handleKey = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
//   };

//   const insertEmoji = (em) => {
//     setText(prev => prev + em);
//     ta.current?.focus();
//   };

//   return (
//     <div className="flex-shrink-0" style={{ background: "#0b141a" }}>
//       {replyTo && <ReplyBanner replyTo={replyTo} onCancel={() => setReplyTo(null)} />}
//       <div className="flex items-end gap-2 px-2 py-[10px]">
//         {/* Emoji button */}
//         <div className="relative flex-shrink-0">
//           {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
//           <button
//             onMouseDown={(e) => e.preventDefault()}
//             onPointerDown={(e) => e.preventDefault()}
//             onClick={() => setShowEmoji(v => !v)}
//             className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 ${showEmoji ? "bg-[#00a884]/20 text-[#00a884]" : "text-[#8696a0] hover:bg-white/8"}`}>
//             <SmileIcon className="size-[22px]" />
//           </button>
//         </div>
//         {/* Text area */}
//         <div className="flex-1 flex items-end rounded-[24px] px-[14px] py-[10px] min-h-[46px]"
//           style={{ background: "#2a3942" }}>
//           <textarea
//             ref={ta}
//             value={text}
//             rows={1}
//             onChange={handleChange}
//             onKeyDown={handleKey}
//             placeholder="Message"
//             className="flex-1 bg-transparent resize-none outline-none leading-[1.45] max-h-[130px] overflow-y-auto"
//             style={{ fontSize: "16px", color: "#e9edef" }}
//           />
//         </div>

//         {/* Send / Mic button */}
//         <div className="flex-shrink-0">
//           {text.trim() ? (
//             <button
//               onMouseDown={(e) => e.preventDefault()} // prevent textarea blur on desktop
//               onPointerDown={(e) => e.preventDefault()} // prevent textarea blur on mobile
//               onClick={send}
//               disabled={busy}
//               className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 disabled:opacity-50 transition-all shadow-lg"
//               style={{ background: "#00a884" }}>
//               <SendIcon className="size-5 text-white ml-0.5" />
//             </button>
//           ) : (
//             <button
//               onMouseDown={(e) => e.preventDefault()}
//               onPointerDown={(e) => e.preventDefault()}
//               className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all shadow-lg"
//               style={{ background: "#00a884" }}>
//               <MicIcon className="size-5 text-white" />
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// /* ════════════════════════════════════════
//    CHAT HEADER  (inside Channel context)
// ════════════════════════════════════════ */
// const ChatHeader = ({ user, userId, authUserId, onVideo, onVoice }) => {
//   const navigate = useNavigate();
//   const name = user?.name || user?.fullName || "Loading...";
//   const avatar = user?.image || user?.profilePic;
//   return (
//     <div className="flex items-center gap-1 flex-shrink-0 z-20"
//       style={{
//         background: "#202c33",
//         borderBottom: "1px solid #2a3942",
//         paddingTop: "max(10px, env(safe-area-inset-top, 10px))",
//         paddingBottom: "10px",
//         paddingLeft: "4px",
//         paddingRight: "4px",
//       }}>
//       <button onClick={() => navigate(-1)}
//         className="p-2 rounded-full text-[#aebac1] hover:bg-white/10 active:bg-white/20 flex-shrink-0 transition-colors">
//         <ArrowLeftIcon className="size-5" />
//       </button>
//       <div className="flex items-center gap-[10px] flex-1 min-w-0 py-1 px-1 rounded-xl cursor-pointer active:bg-white/5 transition-colors">
//         <div className="flex-shrink-0">
//           <Avatar src={avatar} alt={name} size="sm" />
//         </div>
//         <div className="min-w-0 flex-1">
//           <p className="text-[15px] font-semibold truncate leading-[1.2]" style={{ color: "#e9edef" }}>{name}</p>
//           {userId && <OnlineStatus userId={userId} myId={authUserId} />}
//         </div>
//       </div>

//       {/* Call + More */}
//       <div className="flex items-center flex-shrink-0">
//         <button onClick={onVoice}
//           className="p-[10px] rounded-full text-[#aebac1] hover:bg-white/10 active:scale-90 transition-all"
//           aria-label="Voice call">
//           <PhoneIcon className="size-5" />
//         </button>
//         <button onClick={onVideo}
//           className="p-[10px] rounded-full text-[#aebac1] hover:bg-white/10 active:scale-90 transition-all"
//           aria-label="Video call">
//           <VideoIcon className="size-5" />
//         </button>
//         <button className="p-[10px] rounded-full text-[#aebac1] hover:bg-white/10 transition-colors"
//           aria-label="More options">
//           <MoreVerticalIcon className="size-5" />
//         </button>
//       </div>
//     </div>
//   );
// };

// /* ════════════════════════════════════════
//    CHAT INNER  (uses Channel context)
// ════════════════════════════════════════ */
// const ChatInner = ({ channel, targetUser, targetUserId, authUserId, onVideo, onVoice }) => {
//   const listRef = useRef(null);

//   // Scroll to bottom — only on mount + new messages
//   // DO NOT scroll on viewport/keyboard change (that causes the "jump" bug)
//   const scrollBottom = useCallback(() => {
//     const el = listRef.current;
//     if (!el) return;
//     el.scrollTop = el.scrollHeight;
//   }, []);

//   useEffect(() => { setTimeout(scrollBottom, 200); }, [scrollBottom]);

//   useEffect(() => {
//     if (!channel) return;
//     const fn = () => setTimeout(scrollBottom, 60);
//     channel.on("message.new", fn);
//     return () => channel.off("message.new", fn);
//   }, [channel, scrollBottom]);

//   return (
//     <>
//       <ChatHeader user={targetUser} userId={targetUserId} authUserId={authUserId} onVideo={onVideo} onVoice={onVoice} />
//       <div
//         ref={listRef}
//         className="flex-1 overflow-y-auto overscroll-contain"
//         style={{ minHeight: 0, WebkitOverflowScrolling: "touch" }}
//       >
//         <MessageList />
//         {/* Typing indicator is shown in the header (WhatsApp style) — not as a bubble */}
//       </div>

//       <MsgInput channel={channel} />
//     </>
//   );
// };
// /* ════════════════════════════════════════
//    CHAT PAGE
// ════════════════════════════════════════ */
// const ChatPage = () => {
//   const { id: targetUserId } = useParams();
//   const navigate = useNavigate();
//   const [chatClient, setChatClient] = useState(null);
//   const [channel, setChannel] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [targetUser, setTargetUser] = useState(null);
//   const [replyTo, setReplyTo] = useState(null);
//   const { authUser, isLoading: authLoading } = useAuthUser();
//   const { chatBackgroundValue } = useThemeStore();
//   const { height: vh, offsetTop } = useViewport();

//   const { data: td } = useQuery({ queryKey: ["streamToken"], queryFn: getStreamToken, enabled: !!authUser });

//   useEffect(() => {
//     if (!td?.token || !authUser) return;
//     (async () => {
//       try {
//         const c = StreamChat.getInstance(STREAM_API_KEY);
//         // Only connect if not already connected — prevents "connectUser called twice" error
//         if (!c.userID) {
//           await c.connectUser(
//             { id: authUser._id, name: authUser.fullName, image: authUser.profilePic },
//             td.token
//           );
//         }
//         const { users } = await c.queryUsers({ id: { $eq: targetUserId } });
//         if (users[0]) setTargetUser(users[0]);
//         const ch = c.channel("messaging", [authUser._id, targetUserId].sort().join("-"), { members: [authUser._id, targetUserId] });
//         await ch.watch();
//         setChatClient(c); setChannel(ch);

//         ch.on("message.read", async (event) => {
//           if (event.user?.id !== authUser._id) {
//             setTimeout(async () => {
//               const msgs = ch.state.messages || [];
//               for (const msg of msgs) {
//                 if (
//                   msg.user?.id === authUser._id &&
//                   msg.id &&
//                   !msg.deleted_at &&
//                   msg.type !== "deleted"
//                 ) {
//                   try {
//                     const client2 = StreamChat.getInstance(STREAM_API_KEY);
//                     await client2.deleteMessage(msg.id);
//                   } catch { /* silent */ }
//                 }
//               }
//             }, 60 * 1000); // 60 seconds
//           }
//         });

//       } catch (e) { console.error(e); toast.error("Could not connect."); }
//       finally { setLoading(false); }
//     })();
//   }, [td, authUser, targetUserId]);

//   const startCall = useCallback(async (type) => {
//     if (!channel || !authUser) return;
//     const isVideo = type === "video";
//     // Send a custom chat event — IncomingCall.jsx on the receiver's side listens for this
//     try {
//       await channel.sendEvent({
//         type: "call_initiated",
//         callId: channel.id,
//         callerId: authUser._id,
//         callerName: authUser.fullName,
//         callerImage: authUser.profilePic || "",
//         isVideo,
//         channelId: channel.id,
//       });
//     } catch (e) {
//       console.error("Failed to send call event:", e);
//       toast.error("Could not start call");
//       return;
//     }
//     navigate(`/call/${channel.id}${!isVideo ? "?audio=true" : ""}`);
//   }, [channel, authUser, navigate]);

//   if (authLoading || loading || !chatClient || !channel) return <ChatLoader />;

//   return (
//     <RC.Provider value={{ replyTo, setReplyTo }}>
//       {/* ── Inline CSS overrides for Stream ── */}
//       <style>{`
//         @keyframes waDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}
//         /* Strip ALL Stream default UI */
//         .str-chat__channel-header,.str-chat__input-flat,.str-chat__message-input,
//         .str-chat__message-notification,.str-chat__jump-to-latest-message,
//         .str-chat__message-reactions-button,.str-chat__reaction-selector,
//         .str-chat__message-actions-box,.str-chat__message-options,.str-chat__avatar{display:none!important}
//         /* Make all Stream containers transparent + flex column */
//         .str-chat,.str-chat__container,.str-chat__channel{
//           height:100%!important;min-height:0!important;flex:1!important;
//           background:transparent!important;display:flex!important;flex-direction:column!important;}
//         .str-chat__main-panel,.str-chat__main-panel-inner{
//           display:flex!important;flex-direction:column!important;
//           flex:1!important;min-height:0!important;background:transparent!important;}
//         /* Message list transparent, no extra padding */
//         .str-chat__list,.str-chat__message-list,.str-chat__reverse-infinite-scroll{
//           background:transparent!important;padding:4px 0 2px!important;}
//         .str-chat__list::-webkit-scrollbar{display:none}
//         /* Remove all Stream li/wrapper spacing */
//         .str-chat__li,.str-chat__message-simple,.str-chat__message-simple-wrapper{
//           padding:0!important;margin:0!important;background:transparent!important;}
//         /* iOS font-size fix — prevents auto-zoom */
//         textarea,input{font-size:16px!important;}
//       `}</style>
//       <div
//         className="flex flex-col w-full overflow-hidden"
//         style={{
//           height: `${vh}px`,
//           background: chatBackgroundValue || "#0b141a",
//           position: "fixed",
//           top: `${offsetTop}px`,
//           left: 0,
//           right: 0,
//         }}
//       >
//         <Chat client={chatClient}>
//           <Channel channel={channel} Message={CustomMessage} DateSeparator={DateSep} returnAllReadData>
//             <Window hideOnThread>
//               <div className="flex flex-col h-full w-full overflow-hidden">
//                 <ChatInner
//                   channel={channel}
//                   targetUser={targetUser}
//                   targetUserId={targetUserId}
//                   authUserId={authUser?._id}
//                   onVideo={() => startCall("video")}
//                   onVoice={() => startCall("voice")}
//                 />
//               </div>
//             </Window>
//             <Thread />
//           </Channel>
//         </Chat>
//       </div>
//     </RC.Provider>
//   );
// };
// export default ChatPage;




import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import { getStreamToken } from "../lib/api";
import { useState, useEffect, useRef, useCallback, createContext, useContext, memo } from "react";
import useAuthUser from "../hooks/useAuthUser";
import ChatLoader from "../components/ChatLoader";
import { Channel, Chat, MessageList, Thread, Window, useMessageContext, useChannelStateContext } from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import { useThemeStore } from "../Store/useThemeStore";
import {
  VideoIcon, PhoneIcon, ArrowLeftIcon, CopyIcon, SmileIcon, CheckIcon,
  ReplyIcon, XIcon, MicIcon, MoreVerticalIcon, SendIcon, CameraIcon,
  PaperclipIcon, PlayIcon, PauseIcon, SunIcon, MoonIcon, ImageIcon,
  FileVideoIcon, StopCircleIcon,
} from "lucide-react";
import Avatar from "../components/Avatar";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

/* ══════════════════ THEME ══════════════════ */
const ThemeCtx = createContext(null);
const useTheme = () => useContext(ThemeCtx);

const THEMES = {
  dark: {
    bg: "#0d1320", header: "rgba(13,19,31,0.97)", bubble_me: "#1e3a5f",
    bubble_them: "#1a2332", input_bg: "#1a2332", accent: "#00c896",
    text: "#e9edef", subtext: "rgba(255,255,255,0.4)", border: "rgba(255,255,255,0.07)",
    menu_bg: "#1a2332", date_bg: "rgba(0,200,150,0.1)", date_color: "#00c896",
  },
  light: {
    bg: "#f0f2f5", header: "rgba(255,255,255,0.97)", bubble_me: "#d9fdd3",
    bubble_them: "#ffffff", input_bg: "#ffffff", accent: "#00a884",
    text: "#111b21", subtext: "rgba(0,0,0,0.45)", border: "rgba(0,0,0,0.08)",
    menu_bg: "#ffffff", date_bg: "rgba(0,168,132,0.1)", date_color: "#00a884",
  },
};

/* ══════════════════ VIEWPORT ══════════════════ */
const useVP = () => {
  const [vp, setVp] = useState({ height: window.visualViewport?.height ?? window.innerHeight, offsetTop: 0 });
  useEffect(() => {
    const vv = window.visualViewport; if (!vv) return;
    const fn = () => setVp({ height: vv.height, offsetTop: vv.offsetTop });
    vv.addEventListener("resize", fn); vv.addEventListener("scroll", fn);
    return () => { vv.removeEventListener("resize", fn); vv.removeEventListener("scroll", fn); };
  }, []);
  return vp;
};

/* ══════════════════ CONTEXT ══════════════════ */
const RC = createContext(null);
const useReply = () => useContext(RC);

/* ══════════════════ TICK ICONS ══════════════════ */
const Tick = memo(({ double, read }) => double ? (
  <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
    <path d="M1 5.5L4.5 9L10.5 2" stroke={read ? "#53BDEB" : "rgba(255,255,255,0.5)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 5.5L10.5 9L16.5 2" stroke={read ? "#53BDEB" : "rgba(255,255,255,0.5)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
) : (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
    <path d="M1 5L4.5 8.5L13 1" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
));

/* ══════════════════ REACTIONS ══════════════════ */
const REACTS = [{ e: "👍", t: "like" }, { e: "❤️", t: "love" }, { e: "😂", t: "haha" }, { e: "😮", t: "wow" }, { e: "😢", t: "sad" }, { e: "🙏", t: "pray" }];
const T2E = Object.fromEntries(REACTS.map(({ e, t }) => [t, e]));

/* ══════════════════ EMOJI PICKER ══════════════════ */
const EMOJIS = ["😀","😂","🥹","😍","🥰","😎","😭","😤","🤔","😴","👍","👎","👏","🙏","✌️","💪","❤️","🧡","💛","💚","💙","🎉","🔥","⭐","🌈","🎵","⚽","🏆","📱","🍕","😊","🤗","😇","🥳","🤩","😋","🙃","😌","🤫","🫡"];
const EmojiPicker = memo(({ onSelect, onClose, t }) => {
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const tid = setTimeout(() => { document.addEventListener("mousedown", fn); document.addEventListener("touchstart", fn); }, 60);
    return () => { clearTimeout(tid); document.removeEventListener("mousedown", fn); document.removeEventListener("touchstart", fn); };
  }, [onClose]);
  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 z-50 rounded-2xl shadow-2xl overflow-hidden" style={{ background: t.menu_bg, border: `1px solid ${t.border}`, width: 270 }}>
      <div className="grid grid-cols-6 gap-1 p-3 max-h-44 overflow-y-auto">
        {EMOJIS.map((em, i) => (
          <button key={i} onClick={() => onSelect(em)} className="text-xl w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 active:scale-90 transition-all">{em}</button>
        ))}
      </div>
    </div>
  );
});

/* ══════════════════ AUDIO PLAYER ══════════════════ */
const AudioPlayer = memo(({ url, duration, t }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onTime = () => { setProgress((a.currentTime / a.duration) * 100 || 0); setElapsed(Math.floor(a.currentTime)); };
    const onEnd = () => { setPlaying(false); setProgress(0); setElapsed(0); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => { a.removeEventListener("timeupdate", onTime); a.removeEventListener("ended", onEnd); };
  }, []);

  const toggle = () => {
    const a = audioRef.current; if (!a) return;
    if (playing) { a.pause(); setPlaying(false); } else { a.play(); setPlaying(true); }
  };

  const fmtT = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2 py-1 min-w-[160px] max-w-[220px]">
      <audio ref={audioRef} src={url} preload="metadata" />
      <button onClick={toggle} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all" style={{ background: t.accent }}>
        {playing ? <PauseIcon className="size-4 text-white" /> : <PlayIcon className="size-4 text-white ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        {/* Waveform bar */}
        <div className="relative h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.2)" }}>
          <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-200" style={{ width: `${progress}%`, background: t.accent }} />
        </div>
        <span className="text-[10px]" style={{ color: t.subtext }}>{fmtT(elapsed)} / {fmtT(duration || 0)}</span>
      </div>
    </div>
  );
});

/* ══════════════════ VIDEO PLAYER ══════════════════ */
const VideoPlayer = memo(({ url, thumb }) => {
  const [playing, setPlaying] = useState(false);
  const vRef = useRef(null);
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ maxWidth: 240, maxHeight: 180 }}>
      <video ref={vRef} src={url} poster={thumb} className="w-full h-full object-cover" playsInline
        onClick={() => { const v = vRef.current; if (v) { if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); } } }}
      />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
            <PlayIcon className="size-6 text-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );
});

/* ══════════════════ CONTEXT MENU ══════════════════ */
const MsgMenu = memo(({ message, isMine, onReact, onClose, onReply, myRT, t }) => {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const tid = setTimeout(() => { document.addEventListener("mousedown", fn); document.addEventListener("touchstart", fn); }, 60);
    return () => { clearTimeout(tid); document.removeEventListener("mousedown", fn); document.removeEventListener("touchstart", fn); };
  }, [onClose]);
  return (
    <div ref={ref} className={`absolute z-50 bottom-full mb-2 rounded-2xl shadow-2xl min-w-[190px] overflow-hidden ${isMine ? "right-0" : "left-0"}`}
      style={{ background: t.menu_bg, border: `1px solid ${t.border}` }}>
      <div className="flex items-center justify-between px-2 py-2" style={{ borderBottom: `1px solid ${t.border}` }}>
        {REACTS.map(({ e, rt }) => (
          <button key={rt} onClick={() => { onReact(rt); onClose(); }} className={`text-xl w-8 h-8 flex items-center justify-center rounded-full transition-all ${myRT === rt ? "scale-110" : "hover:bg-white/10 active:scale-90"}`}
            style={{ background: myRT === rt ? `${t.accent}30` : "transparent" }}>{e}</button>
        ))}
      </div>
      <button onClick={() => { onReply(message); onClose(); }} className="flex items-center gap-3 px-4 py-3 text-sm w-full hover:bg-white/5" style={{ color: t.text }}>
        <ReplyIcon className="size-4" style={{ color: t.subtext }} /><span>Reply</span>
      </button>
      {message.text && (
        <button onClick={() => { navigator.clipboard?.writeText(message.text || "").then(() => { setCopied(true); setTimeout(onClose, 1200); }); }}
          className="flex items-center gap-3 px-4 py-3 text-sm w-full hover:bg-white/5" style={{ color: t.text, borderTop: `1px solid ${t.border}` }}>
          {copied ? <CheckIcon className="size-4" style={{ color: t.accent }} /> : <CopyIcon className="size-4" style={{ color: t.subtext }} />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      )}
    </div>
  );
});

/* ══════════════════ CALL LOG BUBBLE ══════════════════ */
const CallBubble = memo(({ message }) => {
  const { isMyMessage } = useMessageContext();
  const { theme } = useTheme();
  const t = THEMES[theme];
  const isMine = isMyMessage();
  const isVideo = message.call_type === "video";
  const isMissed = message.call_missed === true;
  const dur = message.call_duration; let durStr = "";
  if (dur > 0) { const m = Math.floor(dur / 60), s = dur % 60; durStr = m > 0 ? `${m}m ${s}s` : `${s}s`; }
  const time = new Date(message.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const label = isMissed ? "Missed call" : `${(message.call_direction === "outgoing" || isMine) ? "Outgoing" : "Incoming"} ${isVideo ? "video" : "voice"} call`;

  return (
    <div className={`flex w-full px-3 mb-1 ${isMine ? "justify-end" : "justify-start"}`}>
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl shadow-sm" style={{
        background: isMine ? t.bubble_me : t.bubble_them, minWidth: 180, maxWidth: 260,
        border: isMissed ? "1px solid rgba(239,68,68,0.3)" : `1px solid ${t.border}`,
      }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: isMissed ? "rgba(239,68,68,0.15)" : `${t.accent}20` }}>
          {isVideo ? <VideoIcon className="size-4" style={{ color: isMissed ? "#ef4444" : t.accent }} /> : <PhoneIcon className="size-4" style={{ color: isMissed ? "#ef4444" : t.accent }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: isMissed ? "#ef4444" : t.text }}>{label}</p>
          {durStr && <p className="text-[11px] mt-0.5" style={{ color: t.subtext }}>{durStr}</p>}
        </div>
        <span className="text-[10px] self-end flex-shrink-0" style={{ color: t.subtext }}>{time}</span>
      </div>
    </div>
  );
});

/* ══════════════════ CUSTOM MESSAGE ══════════════════ */
const CustomMessage = memo(() => {
  const { message, isMyMessage, handleReaction } = useMessageContext();
  const { setReplyTo } = useReply();
  const { theme } = useTheme();
  const t = THEMES[theme];
  const [showMenu, setShowMenu] = useState(false);
  const lpt = useRef(null);
  const isMine = isMyMessage();

  if (message.call_log) return <CallBubble message={message} />;
  if (message.type === "deleted" || message.deleted_at) return null;
  if (!message.text && !message.attachments?.length) return null;
  if (message.text?.includes("/call/") && message.text?.includes("started a")) return null;

  const time = new Date(message.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const isSending = message.status === "sending";
  const isRead = message.readBy && message.readBy.length > 1;
  const myRT = (message.own_reactions || [])[0]?.type || null;
  const rCounts = message.reaction_counts || {};
  const quoted = message.quoted_message || null;
  const isShort = (message.text || "").length <= 15 && !message.attachments?.length;

  const onReact = useCallback(async (type) => {
    try { if (myRT && myRT !== type) await handleReaction(myRT); await handleReaction(type); } catch { }
  }, [handleReaction, myRT]);

  const attachments = message.attachments || [];
  const audioAtt = attachments.find(a => a.type === "audio" || a.mime_type?.startsWith("audio"));
  const videoAtt = attachments.find(a => a.type === "video" || a.mime_type?.startsWith("video"));
  const imageAtt = attachments.filter(a => a.type === "image" || a.mime_type?.startsWith("image"));

  return (
    <div className={`flex w-full px-2 mb-[3px] ${isMine ? "justify-end" : "justify-start"}`}>
      <div className="relative group" style={{ maxWidth: "min(78%, 320px)" }}>
        <button onClick={() => setShowMenu(v => !v)} className={`hidden sm:flex absolute top-2 opacity-0 group-hover:opacity-100 z-10 transition-opacity w-7 h-7 items-center justify-center rounded-full hover:bg-white/10 ${isMine ? "-left-8" : "-right-8"}`} style={{ color: t.subtext }}>
          <SmileIcon className="size-4" />
        </button>
        {showMenu && <MsgMenu message={message} isMine={isMine} myRT={myRT} onReact={onReact} onReply={(m) => setReplyTo(m)} onClose={() => setShowMenu(false)} t={t} />}

        <div
          onTouchStart={() => { lpt.current = setTimeout(() => setShowMenu(true), 450); }}
          onTouchEnd={() => clearTimeout(lpt.current)} onTouchMove={() => clearTimeout(lpt.current)}
          onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
          className="relative px-3 pt-[7px] select-text shadow-sm"
          style={{
            background: isMine ? t.bubble_me : t.bubble_them,
            color: t.text,
            borderRadius: isMine ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
            border: `1px solid ${t.border}`,
            wordBreak: "break-word",
          }}
        >
          {!isMine && message.user?.name && (
            <p className="text-[11px] font-semibold mb-[2px]" style={{ color: t.accent }}>{message.user.name}</p>
          )}
          {quoted && (
            <div className="flex flex-col mb-2 px-2 py-1.5 rounded-lg text-[12px]" style={{ background: isMine ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.08)", borderLeft: `3px solid ${t.accent}` }}>
              <span className="font-semibold truncate" style={{ color: t.accent }}>{quoted.user?.name || "Unknown"}</span>
              <span className="truncate mt-[2px]" style={{ color: t.subtext }}>{quoted.text}</span>
            </div>
          )}

          {/* Audio attachment */}
          {audioAtt && <AudioPlayer url={audioAtt.asset_url || audioAtt.url} duration={audioAtt.duration || Math.round(message.duration || 0)} t={t} />}

          {/* Video attachment */}
          {videoAtt && <div className="mb-1"><VideoPlayer url={videoAtt.asset_url || videoAtt.url} thumb={videoAtt.thumb_url} /></div>}

          {/* Image attachments */}
          {imageAtt.length > 0 && (
            <div className={`mb-1 ${imageAtt.length > 1 ? "grid grid-cols-2 gap-1" : ""}`}>
              {imageAtt.map((img, i) => (
                <img key={i} src={img.image_url || img.asset_url || img.url} alt="img" className="rounded-lg object-cover w-full max-h-48 cursor-pointer"
                  onClick={() => window.open(img.image_url || img.asset_url || img.url, "_blank")} />
              ))}
            </div>
          )}

          {/* Text */}
          {message.text && (isShort ? (
            <div className="pb-[6px]">
              <p className="text-[14px] leading-[1.42]">{message.text}</p>
              <div className="flex items-center justify-end gap-[3px] mt-[3px]">
                <span className="text-[10px]" style={{ color: t.subtext }}>{time}</span>
                {isMine && <Tick double={!isSending} read={isRead} />}
              </div>
            </div>
          ) : (
            <div className="pb-[18px]">
              <p className="text-[14px] leading-[1.42]">{message.text}<span className="inline-block" style={{ width: isMine ? "60px" : "42px" }} /></p>
              <div className="absolute bottom-[6px] right-[10px] flex items-center gap-[3px]">
                <span className="text-[10px]" style={{ color: t.subtext }}>{time}</span>
                {isMine && <Tick double={!isSending} read={isRead} />}
              </div>
            </div>
          ))}

          {/* Time for attachments-only */}
          {!message.text && (audioAtt || videoAtt || imageAtt.length > 0) && (
            <div className="flex items-center justify-end gap-[3px] pb-1 pt-0.5">
              <span className="text-[10px]" style={{ color: t.subtext }}>{time}</span>
              {isMine && <Tick double={!isSending} read={isRead} />}
            </div>
          )}
        </div>

        {Object.keys(rCounts).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
            {Object.entries(rCounts).map(([type, count]) => (
              <button key={type} onClick={() => onReact(type)} className="inline-flex items-center gap-[3px] px-2 py-[3px] rounded-full text-xs border transition-all"
                style={{ background: myRT === type ? `${t.accent}20` : t.bubble_them, borderColor: myRT === type ? `${t.accent}50` : t.border }}>
                <span>{T2E[type] || "👍"}</span>{count > 1 && <span style={{ color: t.subtext }}>{count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

/* ══════════════════ DATE SEPARATOR ══════════════════ */
const DateSep = memo(({ date }) => {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const d = new Date(date), now = new Date(), yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  const label = same(d, now) ? "Today" : same(d, yest) ? "Yesterday" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <div className="flex justify-center my-4">
      <span className="px-3 py-1 rounded-full text-[11px] font-medium" style={{ background: t.date_bg, color: t.date_color, border: `1px solid ${t.date_color}30` }}>{label}</span>
    </div>
  );
});

/* ══════════════════ ONLINE STATUS ══════════════════ */
const OnlineStatus = memo(({ userId, myId }) => {
  const { channel } = useChannelStateContext();
  const { theme } = useTheme();
  const t = THEMES[theme];
  const [online, setOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  useEffect(() => {
    if (!channel || !userId) return;
    setOnline(channel.state?.members?.[userId]?.user?.online ?? false);
    const onP = (e) => { if (e.user?.id === userId) setOnline(e.user.online ?? false); };
    channel.on("user.presence.changed", onP);
    return () => channel.off("user.presence.changed", onP);
  }, [channel, userId]);
  useEffect(() => {
    if (!channel || !myId) return;
    const fn = () => setIsTyping(Object.values(channel.state?.typing || {}).some(u => u.user?.id !== myId));
    channel.on("typing.start", fn); channel.on("typing.stop", fn);
    return () => { channel.off("typing.start", fn); channel.off("typing.stop", fn); };
  }, [channel, myId]);
  if (isTyping) return <span className="text-[11px] animate-pulse" style={{ color: t.accent }}>typing...</span>;
  return <span className="text-[11px]" style={{ color: online ? t.accent : t.subtext }}>{online ? "online" : "offline"}</span>;
});

/* ══════════════════ THEME MENU ══════════════════ */
const ThemeMenu = memo(({ onClose, t }) => {
  const { theme, setTheme } = useTheme();
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const tid = setTimeout(() => { document.addEventListener("mousedown", fn); document.addEventListener("touchstart", fn); }, 60);
    return () => { clearTimeout(tid); document.removeEventListener("mousedown", fn); document.removeEventListener("touchstart", fn); };
  }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 rounded-2xl shadow-2xl z-50 min-w-[160px] overflow-hidden" style={{ background: t.menu_bg, border: `1px solid ${t.border}` }}>
      {[{ key: "dark", label: "Dark Mode", Icon: MoonIcon }, { key: "light", label: "Light Mode", Icon: SunIcon }].map(({ key, label, Icon }) => (
        <button key={key} onClick={() => { setTheme(key); onClose(); }}
          className="flex items-center gap-3 px-4 py-3 w-full text-sm transition-all hover:bg-white/5"
          style={{ color: theme === key ? t.accent : t.text, fontWeight: theme === key ? 600 : 400 }}>
          <Icon className="size-4" /><span>{label}</span>
          {theme === key && <CheckIcon className="size-4 ml-auto" style={{ color: t.accent }} />}
        </button>
      ))}
    </div>
  );
});

/* ══════════════════ CHAT HEADER ══════════════════ */
const ChatHeader = memo(({ user, userId, authUserId, onVideo, onVoice, t }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const name = user?.name || user?.fullName || "Loading...";
  return (
    <div className="flex items-center gap-1 flex-shrink-0 z-20" style={{ background: t.header, borderBottom: `1px solid ${t.border}`, backdropFilter: "blur(12px)", paddingTop: "max(10px, env(safe-area-inset-top, 10px))", paddingBottom: "10px", paddingLeft: "4px", paddingRight: "4px", transition: "background 0.3s" }}>
      <button onClick={() => navigate(-1)} className="p-2 rounded-full active:bg-white/20 flex-shrink-0 transition-colors" style={{ color: t.subtext }}><ArrowLeftIcon className="size-5" /></button>
      <div className="flex items-center gap-3 flex-1 min-w-0 py-1 px-1 rounded-xl">
        <div className="flex-shrink-0"><Avatar src={user?.image || user?.profilePic} alt={name} size="sm" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold truncate leading-tight" style={{ color: t.text }}>{name}</p>
          {userId && <OnlineStatus userId={userId} myId={authUserId} />}
        </div>
      </div>
      <div className="flex items-center flex-shrink-0 gap-1">
        <button onClick={onVoice} aria-label="Voice call" className="p-2.5 rounded-full active:scale-90 transition-all" style={{ color: t.subtext }}><PhoneIcon className="size-5" /></button>
        <button onClick={onVideo} aria-label="Video call" className="p-2.5 rounded-full active:scale-90 transition-all" style={{ color: t.subtext }}><VideoIcon className="size-5" /></button>
        <div className="relative">
          <button onClick={() => setShowMenu(v => !v)} aria-label="More" className="p-2.5 rounded-full transition-colors" style={{ color: t.subtext }}><MoreVerticalIcon className="size-5" /></button>
          {showMenu && <ThemeMenu onClose={() => setShowMenu(false)} t={t} />}
        </div>
      </div>
    </div>
  );
});

/* ══════════════════ VOICE RECORDER ══════════════════ */
const VoiceRecorder = memo(({ onSend, onCancel, t }) => {
  const [secs, setSecs] = useState(0);
  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        mrRef.current = mr;
        mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mr.start(100);
        timerRef.current = setInterval(() => setSecs(s => s + 1), 1000);
      } catch { toast.error("Mic access denied"); onCancel(); }
    })();
    return () => {
      clearInterval(timerRef.current);
      mrRef.current?.stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const stop = (send) => {
    clearInterval(timerRef.current);
    const mr = mrRef.current; if (!mr) return;
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      mr.stream?.getTracks().forEach(t => t.stop());
      if (send) onSend(blob, secs); else onCancel();
    };
    mr.stop();
  };

  const fmtT = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 flex-1">
      <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: "#ef4444" }} />
      <span className="text-sm font-mono flex-1" style={{ color: t.text }}>{fmtT(secs)}</span>
      <span className="text-xs" style={{ color: t.subtext }}>Recording...</span>
      <button onClick={() => stop(false)} className="p-2 rounded-full active:scale-90 transition-all" style={{ color: t.subtext }}><XIcon className="size-5" /></button>
      <button onClick={() => stop(true)} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all" style={{ background: t.accent }}>
        <SendIcon className="size-4 text-white ml-0.5" />
      </button>
    </div>
  );
});

/* ══════════════════ MEDIA PREVIEW ══════════════════ */
const MediaPreview = memo(({ file, onRemove, t }) => {
  const url = URL.createObjectURL(file);
  const isVideo = file.type.startsWith("video");
  const isImage = file.type.startsWith("image");
  return (
    <div className="relative mx-3 mb-2 rounded-xl overflow-hidden" style={{ maxHeight: 160, border: `1px solid ${t.border}` }}>
      {isImage && <img src={url} className="w-full max-h-40 object-contain" style={{ background: t.bubble_them }} alt="preview" />}
      {isVideo && <video src={url} className="w-full max-h-40 object-contain" style={{ background: "#000" }} />}
      {!isImage && !isVideo && (
        <div className="flex items-center gap-2 px-3 py-2" style={{ background: t.bubble_them }}>
          <PaperclipIcon className="size-4" style={{ color: t.subtext }} />
          <span className="text-sm truncate" style={{ color: t.text }}>{file.name}</span>
        </div>
      )}
      <button onClick={onRemove} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
        <XIcon className="size-4 text-white" />
      </button>
      {isVideo && <div className="absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>Video</div>}
    </div>
  );
});

/* ══════════════════ MESSAGE INPUT ══════════════════ */
const MsgInput = memo(({ channel, t }) => {
  const { replyTo, setReplyTo } = useReply();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const ta = useRef(null);
  const fileIn = useRef(null);
  const camIn = useRef(null);

  useEffect(() => {
    const el = ta.current; if (!el) return;
    el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 130) + "px";
  }, [text]);
  useEffect(() => { if (replyTo) { setShowEmoji(false); ta.current?.focus(); } }, [replyTo]);

  const send = async () => {
    const trimmed = text.trim(); if ((!trimmed && !mediaFile) || busy) return;
    setBusy(true); requestAnimationFrame(() => ta.current?.focus());
    try {
      if (mediaFile) {
        setUploading(true); setUploadPct(10);
        const resp = await channel.sendFile(mediaFile, null, (e) => {
          if (e.loaded && e.total) setUploadPct(Math.round((e.loaded / e.total) * 90));
        });
        setUploadPct(100);
        const isAudio = mediaFile.type.startsWith("audio");
        const isVideo = mediaFile.type.startsWith("video");
        const isImage = mediaFile.type.startsWith("image");
        const attType = isAudio ? "audio" : isVideo ? "video" : isImage ? "image" : "file";
        const p = {
          text: trimmed || "",
          attachments: [{ type: attType, asset_url: resp.file, mime_type: mediaFile.type, title: mediaFile.name }],
        };
        if (replyTo) p.quoted_message_id = replyTo.id;
        await channel.sendMessage(p);
        setMediaFile(null); setUploadPct(0); setUploading(false);
      } else {
        const p = { text: trimmed };
        if (replyTo) p.quoted_message_id = replyTo.id;
        await channel.sendMessage(p);
      }
      setText(""); setReplyTo(null);
      requestAnimationFrame(() => ta.current?.focus());
    } catch { toast.error("Failed to send"); setUploading(false); setUploadPct(0); }
    finally { setBusy(false); }
  };

  const sendVoice = async (blob, dur) => {
    setRecording(false);
    try {
      const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
      const resp = await channel.sendFile(file);
      await channel.sendMessage({ text: "", attachments: [{ type: "audio", asset_url: resp.file, mime_type: "audio/webm", duration: dur }] });
    } catch { toast.error("Failed to send voice message"); }
  };

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const isVideo = f.type.startsWith("video");
    if (isVideo && f.size > 2 * 1024 * 1024 * 1024) { toast.error("Video too large (max ~2GB)"); return; }
    setMediaFile(f); e.target.value = "";
  };

  const hasContent = text.trim() || mediaFile;

  return (
    <div className="flex-shrink-0 transition-colors duration-300" style={{ background: t.bg, borderTop: `1px solid ${t.border}` }}>
      {/* Upload progress */}
      {uploading && (
        <div className="mx-3 mb-1">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: t.border }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${uploadPct}%`, background: t.accent }} />
          </div>
        </div>
      )}

      {/* Media preview */}
      {mediaFile && <MediaPreview file={mediaFile} onRemove={() => setMediaFile(null)} t={t} />}

      {/* Reply banner */}
      {replyTo && (
        <div className="flex items-start gap-2 px-3 py-2 mx-3 mt-2 rounded-xl" style={{ background: `${t.accent}12`, borderLeft: `3px solid ${t.accent}` }}>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold" style={{ color: t.accent }}>{replyTo.user?.name || "Unknown"}</p>
            <p className="text-[12px] truncate mt-0.5" style={{ color: t.subtext }}>{replyTo.text}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="p-1 rounded-full" style={{ color: t.subtext }}><XIcon className="size-4" /></button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 px-3 py-3">
        {recording ? (
          <VoiceRecorder onSend={sendVoice} onCancel={() => setRecording(false)} t={t} />
        ) : (
          <>
            {/* Emoji */}
            <div className="relative flex-shrink-0">
              {showEmoji && <EmojiPicker onSelect={(em) => { setText(p => p + em); ta.current?.focus(); }} onClose={() => setShowEmoji(false)} t={t} />}
              <button onMouseDown={e => e.preventDefault()} onPointerDown={e => e.preventDefault()} onClick={() => setShowEmoji(v => !v)}
                className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90"
                style={{ color: showEmoji ? t.accent : t.subtext }}>
                <SmileIcon className="size-[22px]" />
              </button>
            </div>

            {/* Text area */}
            <div className="flex-1 flex items-end rounded-[24px] px-[14px] py-[10px] min-h-[44px]" style={{ background: t.input_bg, border: `1px solid ${t.border}` }}>
              <textarea ref={ta} value={text} rows={1}
                onChange={(e) => { setText(e.target.value); channel.keystroke().catch(() => {}); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Message" className="flex-1 bg-transparent resize-none outline-none leading-[1.45] max-h-[130px] overflow-y-auto"
                style={{ fontSize: "16px", color: t.text }} />

              {/* Camera + attach inside textarea row */}
              <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                <button onClick={() => camIn.current?.click()} className="p-1 rounded-full active:scale-90 transition-all" style={{ color: t.subtext }}>
                  <CameraIcon className="size-[18px]" />
                </button>
                <button onClick={() => fileIn.current?.click()} className="p-1 rounded-full active:scale-90 transition-all" style={{ color: t.subtext }}>
                  <PaperclipIcon className="size-[18px]" />
                </button>
              </div>
            </div>

            {/* Hidden inputs */}
            <input ref={camIn} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
            <input ref={fileIn} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />

            {/* Send / Mic */}
            <button
              onMouseDown={e => e.preventDefault()} onPointerDown={e => e.preventDefault()}
              onClick={hasContent ? send : () => setRecording(true)}
              disabled={busy}
              className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 disabled:opacity-50 transition-all shadow-lg flex-shrink-0"
              style={{ background: hasContent ? t.accent : t.input_bg, border: hasContent ? "none" : `1px solid ${t.border}` }}>
              {hasContent
                ? <SendIcon className="size-5 text-white ml-0.5" />
                : <MicIcon className="size-5" style={{ color: t.subtext }} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
});

/* ══════════════════ CHAT INNER ══════════════════ */
const ChatInner = memo(({ channel, targetUser, targetUserId, authUserId, onVideo, onVoice, t }) => {
  const listRef = useRef(null);
  const scrollBottom = useCallback(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, []);
  useEffect(() => { setTimeout(scrollBottom, 200); }, [scrollBottom]);
  useEffect(() => {
    if (!channel) return;
    const fn = () => setTimeout(scrollBottom, 60);
    channel.on("message.new", fn); return () => channel.off("message.new", fn);
  }, [channel, scrollBottom]);
  return (
    <>
      <ChatHeader user={targetUser} userId={targetUserId} authUserId={authUserId} onVideo={onVideo} onVoice={onVoice} t={t} />
      <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain" style={{ minHeight: 0, WebkitOverflowScrolling: "touch" }}>
        <MessageList />
      </div>
      <MsgInput channel={channel} t={t} />
    </>
  );
});

/* ══════════════════ CHAT PAGE ══════════════════ */
const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const navigate = useNavigate();
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const { authUser, isLoading: authLoading } = useAuthUser();
  const { chatBackgroundValue } = useThemeStore();
  const { height: vh, offsetTop } = useVP();
  const { data: td } = useQuery({ queryKey: ["streamToken"], queryFn: getStreamToken, enabled: !!authUser });

  // Theme state — persisted in localStorage
  const [theme, setThemeState] = useState(() => localStorage.getItem("chatTheme") || "dark");
  const setTheme = useCallback((th) => { setThemeState(th); localStorage.setItem("chatTheme", th); }, []);
  const t = THEMES[theme];

  useEffect(() => {
    if (!td?.token || !authUser) return;
    (async () => {
      try {
        const c = StreamChat.getInstance(STREAM_API_KEY);
        if (!c.userID) await c.connectUser({ id: authUser._id, name: authUser.fullName, image: authUser.profilePic }, td.token);
        const { users } = await c.queryUsers({ id: { $eq: targetUserId } });
        if (users[0]) setTargetUser(users[0]);
        const ch = c.channel("messaging", [authUser._id, targetUserId].sort().join("-"), { members: [authUser._id, targetUserId] });
        await ch.watch();
        setChatClient(c); setChannel(ch);
      } catch (e) { console.error(e); toast.error("Could not connect."); }
      finally { setLoading(false); }
    })();
  }, [td, authUser, targetUserId]);

  const startCall = useCallback(async (type) => {
    if (!channel || !authUser) return;
    const isVideo = type === "video";
    try {
      await channel.sendEvent({ type: "call_initiated", callId: channel.id, callerId: authUser._id, callerName: authUser.fullName, callerImage: authUser.profilePic || "", isVideo, channelId: channel.id });
    } catch { toast.error("Could not start call"); return; }
    navigate(`/call/${channel.id}${!isVideo ? "?audio=true" : ""}`);
  }, [channel, authUser, navigate]);

  if (authLoading || loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <ThemeCtx.Provider value={{ theme, setTheme }}>
      <RC.Provider value={{ replyTo, setReplyTo }}>
        <style>{`
          @keyframes waDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}
          .str-chat__channel-header,.str-chat__input-flat,.str-chat__message-input,
          .str-chat__message-notification,.str-chat__jump-to-latest-message,
          .str-chat__message-reactions-button,.str-chat__reaction-selector,
          .str-chat__message-actions-box,.str-chat__message-options,.str-chat__avatar{display:none!important}
          .str-chat,.str-chat__container,.str-chat__channel{height:100%!important;min-height:0!important;flex:1!important;background:transparent!important;display:flex!important;flex-direction:column!important;}
          .str-chat__main-panel,.str-chat__main-panel-inner{display:flex!important;flex-direction:column!important;flex:1!important;min-height:0!important;background:transparent!important;}
          .str-chat__list,.str-chat__message-list,.str-chat__reverse-infinite-scroll{background:transparent!important;padding:4px 0 2px!important;}
          .str-chat__list::-webkit-scrollbar{display:none}
          .str-chat__li,.str-chat__message-simple,.str-chat__message-simple-wrapper{padding:0!important;margin:0!important;background:transparent!important;}
          textarea,input{font-size:16px!important;}
          *{transition:background-color 0.25s ease,border-color 0.25s ease,color 0.2s ease;}
          *::-webkit-scrollbar{display:none}
        `}</style>
        <div className="flex flex-col w-full overflow-hidden" style={{ height: `${vh}px`, background: chatBackgroundValue || t.bg, position: "fixed", top: `${offsetTop}px`, left: 0, right: 0 }}>
          <Chat client={chatClient}>
            <Channel channel={channel} Message={CustomMessage} DateSeparator={DateSep} returnAllReadData>
              <Window hideOnThread>
                <div className="flex flex-col h-full w-full overflow-hidden">
                  <ChatInner channel={channel} targetUser={targetUser} targetUserId={targetUserId} authUserId={authUser?._id} onVideo={() => startCall("video")} onVoice={() => startCall("voice")} t={t} />
                </div>
              </Window>
              <Thread />
            </Channel>
          </Chat>
        </div>
      </RC.Provider>
    </ThemeCtx.Provider>
  );
};
export default ChatPage;