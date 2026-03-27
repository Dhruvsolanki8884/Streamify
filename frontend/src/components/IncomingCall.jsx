// import { useEffect, useState, useRef, useCallback } from "react";
// import { useNavigate, useLocation } from "react-router";
// import { useQuery } from "@tanstack/react-query";
// import { StreamChat } from "stream-chat";
// import { getStreamToken } from "../lib/api";
// import useAuthUser from "../hooks/useAuthUser";
// import { PhoneIcon, PhoneOffIcon, VideoIcon } from "lucide-react";

// const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

// const IncomingCall = () => {
//   const { authUser } = useAuthUser();
//   const { data: tokenData } = useQuery({
//     queryKey: ["streamToken"],
//     queryFn: getStreamToken,
//     enabled: !!authUser,
//   });

//   const [incoming, setIncoming] = useState(null);
//   const dismissTimer = useRef(null);
//   const cleanupRef = useRef(null);
//   const navigate = useNavigate();
//   const location = useLocation();

//   const onCallPage = location.pathname.startsWith("/call/");

//   useEffect(() => {
//     if (!tokenData?.token || !authUser) return;
//     let active = true;

//     const setup = async () => {
//       try {
//         const client = StreamChat.getInstance(STREAM_API_KEY);

//         // Connect only if not already connected — prevents "connectUser called twice"
//         if (!client.userID) {
//           await client.connectUser(
//             { id: authUser._id, name: authUser.fullName, image: authUser.profilePic },
//             tokenData.token
//           );
//         }

//         if (!active) return;

//         // Stream requires members.$in filter — without it you get 403
//         const channels = await client.queryChannels(
//           { type: "messaging", members: { $in: [authUser._id] } },
//           { last_message_at: -1 },
//           { watch: true, state: true, limit: 30 }
//         );

//         if (!active) return;

//         // ── Incoming call event ──
//         const onCallInitiated = (event) => {
//           if (!active) return;
//           if (event.type !== "call_initiated") return;
//           if (event.callerId === authUser._id) return;

//           const { callId, callerName, callerImage, isVideo, channelId } = event;
//           setIncoming({ callId, callerName, callerImage: callerImage || "", isVideo, channelId });

//           // Auto-dismiss after 45s → missed call
//           clearTimeout(dismissTimer.current);
//           dismissTimer.current = setTimeout(async () => {
//             if (!active) return;
//             try {
//               const ch = client.channel("messaging", channelId);
//               await ch.watch();
//               await ch.sendMessage({
//                 text: "Missed call",
//                 call_log: true,
//                 call_type: isVideo ? "video" : "voice",
//                 call_duration: 0,
//                 call_missed: true,
//                 call_direction: "incoming",
//               });
//             } catch { /* silent */ }
//             setIncoming(null);
//           }, 45000);
//         };

//         // ── Caller cancelled or call ended ──
//         const onCallCancelled = (event) => {
//           if (!active) return;
//           if (event.type !== "call_cancelled" && event.type !== "call_ended") return;
//           setIncoming(prev => {
//             if (prev?.callId === event.callId) {
//               clearTimeout(dismissTimer.current);
//               return null;
//             }
//             return prev;
//           });
//         };

//         client.on(onCallInitiated);
//         client.on(onCallCancelled);

//         cleanupRef.current = () => {
//           client.off(onCallInitiated);
//           client.off(onCallCancelled);
//         };
//       } catch (e) {
//         console.error("IncomingCall setup error:", e);
//       }
//     };

//     setup();

//     return () => {
//       active = false;
//       clearTimeout(dismissTimer.current);
//       cleanupRef.current?.();
//     };
//   }, [tokenData, authUser]);

//   const handleAccept = useCallback(() => {
//     if (!incoming) return;
//     clearTimeout(dismissTimer.current);
//     const { callId, isVideo } = incoming;
//     setIncoming(null);
//     navigate(`/call/${callId}${!isVideo ? "?audio=true" : ""}`);
//   }, [incoming, navigate]);

//   const handleReject = useCallback(async () => {
//     if (!incoming) return;
//     clearTimeout(dismissTimer.current);
//     try {
//       const client = StreamChat.getInstance(STREAM_API_KEY);
//       const ch = client.channel("messaging", incoming.channelId);
//       await ch.watch();
//       await ch.sendEvent({ type: "call_rejected", callId: incoming.callId });
//       await ch.sendMessage({
//         text: "Missed call",
//         call_log: true,
//         call_type: incoming.isVideo ? "video" : "voice",
//         call_duration: 0,
//         call_missed: true,
//         call_direction: "incoming",
//       });
//     } catch { /* silent */ }
//     setIncoming(null);
//   }, [incoming]);

//   if (!incoming || onCallPage) return null;

//   const { callerName, callerImage, isVideo } = incoming;

//   return (
//     <div
//       className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none"
//       style={{ background: "linear-gradient(160deg, #0b1117 0%, #1a2630 60%, #0d1f1a 100%)" }}
//     >
//       <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-10"
//         style={{ color: "rgba(0,168,132,0.7)" }}>
//         {isVideo ? "Incoming Video Call" : "Incoming Voice Call"}
//       </p>

//       <div className="relative flex items-center justify-center mb-8">
//         <div className="absolute rounded-full animate-ping"
//           style={{ width: 220, height: 220, background: "rgba(0,168,132,0.06)", animationDuration: "2.2s" }} />
//         <div className="absolute rounded-full animate-ping"
//           style={{ width: 175, height: 175, background: "rgba(0,168,132,0.1)", animationDuration: "2.2s", animationDelay: "0.55s" }} />
//         <div className="w-32 h-32 rounded-full overflow-hidden relative z-10 shadow-2xl"
//           style={{ border: "3px solid rgba(0,168,132,0.6)", boxShadow: "0 0 40px rgba(0,168,132,0.25)" }}>
//           {callerImage ? (
//             <img src={callerImage} alt={callerName} className="w-full h-full object-cover" />
//           ) : (
//             <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white"
//               style={{ background: "linear-gradient(135deg, #00a884, #025144)" }}>
//               {callerName?.charAt(0)?.toUpperCase() || "?"}
//             </div>
//           )}
//         </div>
//       </div>

//       <h2 className="text-white text-3xl font-bold mb-2 tracking-tight">{callerName}</h2>
//       <div className="flex items-center gap-2 mb-20" style={{ color: "rgba(255,255,255,0.45)" }}>
//         {isVideo
//           ? <><VideoIcon className="size-4" /><span className="text-sm">Video</span></>
//           : <><PhoneIcon className="size-4" /><span className="text-sm">Voice</span></>}
//       </div>

//       <div className="flex items-center justify-center gap-24">
//         <div className="flex flex-col items-center gap-3">
//           <button onClick={handleReject}
//             className="w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all active:scale-90"
//             style={{ background: "#ef4444", boxShadow: "0 0 30px rgba(239,68,68,0.55)" }}>
//             <PhoneOffIcon className="size-8 text-white" />
//           </button>
//           <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Decline</span>
//         </div>
//         <div className="flex flex-col items-center gap-3">
//           <button onClick={handleAccept}
//             className="w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all active:scale-90"
//             style={{ background: "#00a884", boxShadow: "0 0 30px rgba(0,168,132,0.55)" }}>
//             <PhoneIcon className="size-8 text-white" />
//           </button>
//           <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Accept</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default IncomingCall;



import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";
import { getStreamToken } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import { PhoneIcon, PhoneOffIcon, VideoIcon } from "lucide-react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const IncomingCall = () => {
  const { authUser } = useAuthUser();
  const { data: tokenData } = useQuery({ queryKey: ["streamToken"], queryFn: getStreamToken, enabled: !!authUser });
  const [incoming, setIncoming] = useState(null);
  const dismissTimer = useRef(null);
  const cleanupRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const onCallPage = location.pathname.startsWith("/call/");

  useEffect(() => {
    if (!tokenData?.token || !authUser) return;
    let active = true;
    (async () => {
      try {
        const client = StreamChat.getInstance(STREAM_API_KEY);
        if (!client.userID) await client.connectUser({ id: authUser._id, name: authUser.fullName, image: authUser.profilePic }, tokenData.token);
        if (!active) return;

        await client.queryChannels({ type: "messaging", members: { $in: [authUser._id] } }, { last_message_at: -1 }, { watch: true, state: true, limit: 30 });
        if (!active) return;

        const onCallInitiated = (event) => {
          if (!active || event.type !== "call_initiated" || event.callerId === authUser._id) return;
          const { callId, callerName, callerImage, isVideo, channelId } = event;
          setIncoming({ callId, callerName, callerImage: callerImage || "", isVideo, channelId });
          clearTimeout(dismissTimer.current);
          dismissTimer.current = setTimeout(async () => {
            if (!active) return;
            try {
              const ch = client.channel("messaging", channelId);
              await ch.watch();
              await ch.sendMessage({ text: "Missed call", call_log: true, call_type: isVideo ? "video" : "voice", call_duration: 0, call_missed: true, call_direction: "incoming" });
            } catch { }
            setIncoming(null);
          }, 45000);
        };

        const onCallCancelled = (event) => {
          if (!active || (event.type !== "call_cancelled" && event.type !== "call_ended")) return;
          setIncoming(prev => { if (prev?.callId === event.callId) { clearTimeout(dismissTimer.current); return null; } return prev; });
        };

        client.on(onCallInitiated); client.on(onCallCancelled);
        cleanupRef.current = () => { client.off(onCallInitiated); client.off(onCallCancelled); };
      } catch (e) { console.error("IncomingCall setup error:", e); }
    })();
    return () => { active = false; clearTimeout(dismissTimer.current); cleanupRef.current?.(); };
  }, [tokenData, authUser]);

  const handleAccept = useCallback(() => {
    if (!incoming) return;
    clearTimeout(dismissTimer.current);
    const { callId, isVideo } = incoming;
    setIncoming(null);
    navigate(`/call/${callId}${!isVideo ? "?audio=true" : ""}`);
  }, [incoming, navigate]);

  const handleReject = useCallback(async () => {
    if (!incoming) return;
    clearTimeout(dismissTimer.current);
    try {
      const client = StreamChat.getInstance(STREAM_API_KEY);
      const ch = client.channel("messaging", incoming.channelId);
      await ch.watch();
      await ch.sendEvent({ type: "call_rejected", callId: incoming.callId });
      await ch.sendMessage({ text: "Missed call", call_log: true, call_type: incoming.isVideo ? "video" : "voice", call_duration: 0, call_missed: true, call_direction: "incoming" });
    } catch { }
    setIncoming(null);
  }, [incoming]);

  if (!incoming || onCallPage) return null;
  const { callerName, callerImage, isVideo } = incoming;

  return (
    <>
      <style>{`
        @keyframes ringPulse { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.08); opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .incoming-overlay { animation: fadeIn 0.3s ease; }
        .incoming-card { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>

      {/* Backdrop blur overlay */}
      <div className="incoming-overlay fixed inset-0 z-[9999]" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(16px)" }}>
        <div className="w-full h-full flex flex-col items-center justify-center px-6">

          {/* Card */}
          <div className="incoming-card w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl" style={{ background: "linear-gradient(145deg, rgba(13,25,40,0.98), rgba(6,15,28,0.98))", border: "1px solid rgba(0,200,150,0.2)", boxShadow: "0 0 60px rgba(0,200,150,0.15), 0 40px 80px rgba(0,0,0,0.6)" }}>

            {/* Top status bar */}
            <div className="flex items-center justify-center gap-2 pt-5 pb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: "#00c896", animation: "ringPulse 1.5s ease-in-out infinite" }} />
              <p className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: "rgba(0,200,150,0.8)" }}>
                {isVideo ? "Incoming Video Call" : "Incoming Voice Call"}
              </p>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center py-8">
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute rounded-full animate-ping" style={{ width: 200, height: 200, background: "rgba(0,200,150,0.05)", animationDuration: "2s" }} />
                <div className="absolute rounded-full animate-ping" style={{ width: 160, height: 160, background: "rgba(0,200,150,0.09)", animationDuration: "2s", animationDelay: "0.5s" }} />
                <div className="w-[120px] h-[120px] rounded-full overflow-hidden relative z-10 shadow-2xl" style={{ border: "3px solid rgba(0,200,150,0.5)", boxShadow: "0 0 40px rgba(0,200,150,0.25)" }}>
                  {callerImage ? (
                    <img src={callerImage} alt={callerName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white" style={{ background: "linear-gradient(135deg, #00c896, #025144)" }}>
                      {callerName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
              </div>

              <h2 className="text-white text-2xl font-bold tracking-tight mb-2">{callerName}</h2>
              <div className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                {isVideo ? <VideoIcon className="size-3.5" /> : <PhoneIcon className="size-3.5" />}
                <span className="text-xs">{isVideo ? "Video" : "Voice"}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-16 pb-10">
              <div className="flex flex-col items-center gap-2.5">
                <button onClick={handleReject} className="w-[64px] h-[64px] rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 0 30px rgba(239,68,68,0.45)" }}>
                  <PhoneOffIcon className="size-7 text-white" />
                </button>
                <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>Decline</span>
              </div>
              <div className="flex flex-col items-center gap-2.5">
                <button onClick={handleAccept} className="w-[64px] h-[64px] rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #00c896, #007a5e)", boxShadow: "0 0 30px rgba(0,200,150,0.45)" }}>
                  <PhoneIcon className="size-7 text-white" />
                </button>
                <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>Accept</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default IncomingCall;
