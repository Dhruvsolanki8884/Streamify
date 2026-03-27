// import { useEffect, useState, useRef, useCallback } from "react";
// import { useNavigate, useParams, useSearchParams } from "react-router";
// import useAuthUser from "../hooks/useAuthUser";
// import { useQuery } from "@tanstack/react-query";
// import { getStreamToken } from "../lib/api";
// import {
//   StreamVideo, StreamVideoClient, StreamCall,
//   CallingState, useCallStateHooks, ParticipantView,
// } from "@stream-io/video-react-sdk";
// import "@stream-io/video-react-sdk/dist/css/styles.css";
// import { StreamChat } from "stream-chat";
// import toast from "react-hot-toast";
// import PageLoader from "../components/pageLoader.jsx";
// import {
//   PhoneOffIcon, MicIcon, MicOffIcon,
//   VideoIcon, VideoOffIcon, Volume2Icon, VolumeXIcon,
//   RotateCcwIcon,
// } from "lucide-react";

// const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

// const pad = n => String(n).padStart(2, "0");
// const fmtDur = secs => {
//   const h = Math.floor(secs / 3600);
//   const m = Math.floor((secs % 3600) / 60);
//   const s = secs % 60;
//   return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
// };

// /* ── Timer ── */
// const Timer = ({ active, label }) => {
//   const [secs, setSecs] = useState(0);
//   useEffect(() => {
//     if (!active) { setSecs(0); return; }
//     const id = setInterval(() => setSecs(s => s + 1), 1000);
//     return () => clearInterval(id);
//   }, [active]);

//   if (!active) return (
//     <span className="text-sm animate-pulse" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
//   );
//   return (
//     <span className="text-sm font-mono tracking-wide" style={{ color: "rgba(255,255,255,0.85)" }}>
//       {fmtDur(secs)}
//     </span>
//   );
// };

// /* ── Generic round button ── */
// const RoundBtn = ({ active, activeColor = "#ef4444", onClick, children, label, size = "sm" }) => {
//   const dim = size === "lg" ? "w-[70px] h-[70px]" : "w-14 h-14";
//   return (
//     <div className="flex flex-col items-center gap-2">
//       <button
//         onClick={onClick}
//         className={`${dim} rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shadow-md`}
//         style={{
//           background: active ? `${activeColor}33` : "rgba(255,255,255,0.15)",
//           border: active ? `1.5px solid ${activeColor}99` : "1.5px solid rgba(255,255,255,0.12)",
//           boxShadow: active ? `0 0 18px ${activeColor}44` : "none",
//         }}
//       >
//         {children}
//       </button>
//       {label && <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>}
//     </div>
//   );
// };

// /* ── Controls bar ── */
// const Controls = ({ isAudioOnly, onEnd, call }) => {
//   const { useMicrophoneState, useCameraState } = useCallStateHooks();
//   const { microphone, isMute: micOff } = useMicrophoneState();
//   const { camera, isMute: camOff } = useCameraState();

//   // Speaker state — default OFF (earpiece mode like a real phone call)
//   const [speakerOn, setSpeakerOn] = useState(false);
//   // Camera facing — "user" = front, "environment" = back
//   const [facingMode, setFacingMode] = useState("user");

//   // Toggle speaker using setSinkId where supported, with proper mobile fallback
//   const toggleSpeaker = useCallback(async () => {
//     const next = !speakerOn;
//     setSpeakerOn(next);
//     try {
//       const audioEls = Array.from(document.querySelectorAll("audio"));
//       const videoEls = Array.from(document.querySelectorAll("video")).filter(v => !v.muted);

//       for (const el of [...audioEls, ...videoEls]) {
//         // Always ensure audio is NOT muted regardless of speaker state
//         el.muted = false;
//         el.volume = 1.0;

//         if (typeof el.setSinkId === "function") {
//           // Desktop Chrome / some Android: route to speaker or default output
//           await el.setSinkId(next ? "default" : "").catch(() => {});
//         }
//         // On iOS/Android without setSinkId: we can't switch hardware output
//         // but we ensure max volume and unmuted state so audio is always audible
//       }
//     } catch { /* silent */ }
//   }, [speakerOn]);

//   // Switch front/back camera
//   const switchCamera = useCallback(async () => {
//     if (!call) return;
//     const next = facingMode === "user" ? "environment" : "user";
//     setFacingMode(next);
//     try {
//       // Stream SDK camera flip
//       await call.camera.flip();
//     } catch {
//       // Fallback: restart camera with new constraints
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: { facingMode: next },
//           audio: false,
//         });
//         stream.getTracks().forEach(t => t.stop());
//       } catch { /* silent */ }
//     }
//   }, [call, facingMode]);

//   return (
//     <div className="flex items-center justify-center gap-5 py-8 px-4">
//       {/* Mute mic */}
//       <RoundBtn
//         active={micOff}
//         onClick={() => micOff ? microphone.enable() : microphone.disable()}
//         label={micOff ? "Unmute" : "Mute"}
//       >
//         {micOff
//           ? <MicOffIcon className="size-6" style={{ color: "#f87171" }} />
//           : <MicIcon className="size-6 text-white" />}
//       </RoundBtn>

//       {/* End call */}
//       <div className="flex flex-col items-center gap-2">
//         <button
//           onClick={onEnd}
//           className="w-[70px] h-[70px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
//           style={{ background: "#ef4444", boxShadow: "0 0 28px rgba(239,68,68,0.6)" }}
//         >
//           <PhoneOffIcon className="size-7 text-white" />
//         </button>
//         <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>End</span>
//       </div>

//       {!isAudioOnly ? (
//         /* Video call: camera toggle + camera switch */
//         <>
//           <RoundBtn
//             active={camOff}
//             onClick={() => camOff ? camera.enable() : camera.disable()}
//             label={camOff ? "Cam off" : "Camera"}
//           >
//             {camOff
//               ? <VideoOffIcon className="size-6" style={{ color: "#f87171" }} />
//               : <VideoIcon className="size-6 text-white" />}
//           </RoundBtn>
//           <RoundBtn
//             active={false}
//             onClick={switchCamera}
//             label="Flip"
//           >
//             <RotateCcwIcon className="size-5 text-white" />
//           </RoundBtn>
//         </>
//       ) : (
//         /* Voice call: speaker toggle */
//         <RoundBtn
//           active={speakerOn}
//           activeColor="#00a884"
//           onClick={toggleSpeaker}
//           label={speakerOn ? "Speaker" : "Earpiece"}
//         >
//           {speakerOn
//             ? <Volume2Icon className="size-6" style={{ color: "#00a884" }} />
//             : <VolumeXIcon className="size-6 text-white" />}
//         </RoundBtn>
//       )}
//     </div>
//   );
// };

// /* ── Call content (inside StreamCall context) ── */
// const CallContent = ({ isAudioOnly, peerName, peerImage, onCallEnd, onMissed, call }) => {
//   const { useCallCallingState, useParticipants, useLocalParticipant } = useCallStateHooks();
//   const state = useCallCallingState();
//   const participants = useParticipants();
//   const local = useLocalParticipant();
//   const navigate = useNavigate();

//   const remotes = participants.filter(p => !p.isLocalParticipant);
//   const iJoined = state === CallingState.JOINED;
//   const bothConnected = iJoined && remotes.length > 0;

//   const startTimeRef = useRef(null);
//   const missedTimerRef = useRef(null);
//   const missedFiredRef = useRef(false);

//   // Start timer only when BOTH are connected
//   useEffect(() => {
//     if (bothConnected && !startTimeRef.current) {
//       startTimeRef.current = Date.now();
//       clearTimeout(missedTimerRef.current);
//     }
//   }, [bothConnected]);

//   // 30s no-answer → missed
//   useEffect(() => {
//     if (!iJoined || bothConnected) return;
//     missedTimerRef.current = setTimeout(() => {
//       if (!startTimeRef.current && !missedFiredRef.current) {
//         missedFiredRef.current = true;
//         onMissed();
//       }
//     }, 30000);
//     return () => clearTimeout(missedTimerRef.current);
//   }, [iJoined, bothConnected, onMissed]);

//   useEffect(() => {
//     if (state === CallingState.LEFT) navigate(-1);
//   }, [state, navigate]);

//   if (state === CallingState.LEFT) return null;

//   const statusLabel = bothConnected ? null
//     : state === CallingState.JOINING ? "Connecting..."
//     : iJoined ? "Ringing..."
//     : "Calling...";

//   const endCall = async () => {
//     const dur = startTimeRef.current
//       ? Math.round((Date.now() - startTimeRef.current) / 1000)
//       : 0;
//     clearTimeout(missedTimerRef.current);
//     try { await window.__streamCall?.leave(); } catch { /* silent */ }
//     onCallEnd(dur);
//   };

//   return (
//     <div className="flex flex-col" style={{ height: "100dvh", background: "#0d1117" }}>
//       {/* Top overlay */}
//       <div className="absolute top-0 left-0 right-0 z-20 px-5 pb-4"
//         style={{ paddingTop: "max(20px, env(safe-area-inset-top, 20px))", background: "linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)" }}>
//         <p className="text-white font-semibold text-base leading-tight">{peerName}</p>
//         <Timer active={bothConnected} label={statusLabel || "Calling..."} />
//       </div>

//       {/* Media */}
//       <div className="flex-1 relative overflow-hidden">
//         {isAudioOnly ? (
//           <div className="w-full h-full flex flex-col items-center justify-center gap-6"
//             style={{ background: "linear-gradient(160deg, #1a2630, #0d1117)" }}>
//             {/* Bind audio streams */}
//             {remotes.map(p => (
//               <div key={p.sessionId} className="sr-only" aria-hidden>
//                 <ParticipantView participant={p} trackType="audioTrack" />
//               </div>
//             ))}
//             <div className="relative flex items-center justify-center">
//               <div className="absolute rounded-full animate-ping"
//                 style={{ width: 210, height: 210, background: "rgba(0,168,132,0.07)", animationDuration: "2.2s" }} />
//               <div className="absolute rounded-full animate-ping"
//                 style={{ width: 168, height: 168, background: "rgba(0,168,132,0.11)", animationDuration: "2.2s", animationDelay: "0.55s" }} />
//               <div className="w-32 h-32 rounded-full overflow-hidden shadow-2xl relative z-10"
//                 style={{ border: "3px solid rgba(0,168,132,0.5)", boxShadow: "0 0 40px rgba(0,168,132,0.2)" }}>
//                 {peerImage
//                   ? <img src={peerImage} alt={peerName} className="w-full h-full object-cover" />
//                   : <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white"
//                       style={{ background: "linear-gradient(135deg,#00a884,#025144)" }}>
//                       {peerName?.charAt(0)?.toUpperCase() || "?"}
//                     </div>}
//               </div>
//             </div>
//             <div className="text-center">
//               <p className="text-white text-2xl font-semibold">{peerName}</p>
//               <div className="mt-2">
//                 <Timer active={bothConnected} label={statusLabel || "Calling..."} />
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="w-full h-full">
//             {remotes.length > 0 ? (
//               <div className="w-full h-full">
//                 <ParticipantView participant={remotes[0]}
//                   className="w-full h-full object-cover" trackType="videoTrack" />
//               </div>
//             ) : (
//               <div className="w-full h-full flex flex-col items-center justify-center gap-4"
//                 style={{ background: "linear-gradient(160deg, #1a2630, #0d1117)" }}>
//                 <div className="w-28 h-28 rounded-full overflow-hidden shadow-2xl"
//                   style={{ border: "3px solid rgba(0,168,132,0.4)" }}>
//                   {peerImage
//                     ? <img src={peerImage} alt={peerName} className="w-full h-full object-cover" />
//                     : <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
//                         style={{ background: "linear-gradient(135deg,#00a884,#025144)" }}>
//                         {peerName?.charAt(0)?.toUpperCase()}
//                       </div>}
//                 </div>
//                 <p className="text-white text-xl font-medium">{peerName}</p>
//                 <p className="text-sm animate-pulse" style={{ color: "rgba(255,255,255,0.4)" }}>
//                   {statusLabel || "Calling..."}
//                 </p>
//               </div>
//             )}
//             {local && (
//               <div className="absolute top-16 right-3 w-24 h-36 sm:w-28 sm:h-44 rounded-xl overflow-hidden shadow-2xl z-10"
//                 style={{ border: "2px solid rgba(255,255,255,0.2)" }}>
//                 <ParticipantView participant={local}
//                   className="w-full h-full object-cover" trackType="videoTrack" mirror />
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Controls */}
//       <div className="shrink-0"
//         style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)", background: "linear-gradient(to top, #0d1117 60%, transparent)" }}>
//         <Controls isAudioOnly={isAudioOnly} onEnd={endCall} call={call} />
//       </div>
//     </div>
//   );
// };

// /* ══════════════════════════════════════
//    CALL PAGE
// ══════════════════════════════════════ */
// const CallPage = () => {
//   const { id: callId } = useParams();
//   const [sp] = useSearchParams();
//   const isAudioOnly = sp.get("audio") === "true";

//   const [videoClient, setVideoClient] = useState(null);
//   const [call, setCall] = useState(null);
//   const [busy, setBusy] = useState(true);
//   const [peerName, setPeerName] = useState("");
//   const [peerImage, setPeerImage] = useState("");
//   const [chatCh, setChatCh] = useState(null);
//   const isCallerRef = useRef(false);
//   const clientRef = useRef(null);
//   const navigate = useNavigate();
//   const { authUser, isLoading: authLoading } = useAuthUser();
//   const { data: tokenData } = useQuery({
//     queryKey: ["streamToken"],
//     queryFn: getStreamToken,
//     enabled: !!authUser,
//   });

//   useEffect(() => {
//     if (!tokenData?.token || !authUser || !callId) return;
//     let cancelled = false;

//     (async () => {
//       try {
//         // Clean up any stale video client
//         if (window.__streamVideoClient) {
//           try { await window.__streamVideoClient.disconnectUser(); } catch { /* silent */ }
//           window.__streamVideoClient = null;
//         }

//         const vc = new StreamVideoClient({
//           apiKey: STREAM_API_KEY,
//           user: { id: authUser._id, name: authUser.fullName, image: authUser.profilePic },
//           token: tokenData.token,
//         });
//         window.__streamVideoClient = vc;
//         clientRef.current = vc;

//         const ci = vc.call("default", callId);
//         window.__streamCall = ci;

//         // Request permissions before joining
//         try {
//           const stream = await navigator.mediaDevices.getUserMedia(
//             isAudioOnly ? { audio: true } : { audio: true, video: true }
//           );
//           stream.getTracks().forEach(t => t.stop());
//         } catch (permErr) {
//           toast.error(
//             permErr.name === "NotAllowedError"
//               ? "Microphone permission denied. Allow mic access in browser settings."
//               : "Could not access microphone.",
//             { duration: 5000 }
//           );
//           if (!cancelled) setBusy(false);
//           return;
//         }

//         if (isAudioOnly) await ci.camera.disable();
//         await ci.join({ create: true });

//         // Resolve peer info
//         const membersMap = ci.state?.members || {};
//         const other = Object.values(membersMap).find(m => m.user_id !== authUser._id);
//         if (other?.user) {
//           setPeerName(other.user.name || "");
//           setPeerImage(other.user.image || "");
//         }

//         const createdById = ci.state?.createdBy?.id;
//         isCallerRef.current = !createdById || createdById === authUser._id;

//         // Chat channel
//         const cc = StreamChat.getInstance(STREAM_API_KEY);
//         if (!cc.userID) {
//           await cc.connectUser(
//             { id: authUser._id, name: authUser.fullName, image: authUser.profilePic },
//             tokenData.token
//           );
//         }
//         const targetId = callId.split("-").find(id => id !== authUser._id);
//         if (targetId) {
//           const ch = cc.channel("messaging", callId, { members: [authUser._id, targetId] });
//           await ch.watch();
//           if (!cancelled) setChatCh(ch);

//           ch.on((event) => {
//             if (event.type === "call_rejected" && event.callId === callId) {
//               ch.sendMessage({
//                 text: "Missed call", call_log: true,
//                 call_type: isAudioOnly ? "voice" : "video",
//                 call_duration: 0, call_missed: true, call_direction: "outgoing",
//               }).catch(() => {});
//               navigate(-1);
//             }
//             if (event.type === "call_ended" && event.callId === callId) {
//               navigate(-1);
//             }
//           });
//         }

//         if (!cancelled) { setVideoClient(vc); setCall(ci); }
//       } catch (e) {
//         console.error("Call join error:", e);
//         toast.error("Could not connect to call.");
//       } finally {
//         if (!cancelled) setBusy(false);
//       }
//     })();

//     return () => {
//       cancelled = true;
//       window.__streamCall = null;
//       window.__streamVideoClient = null;
//       clientRef.current?.disconnectUser().catch(() => {});
//     };
//   }, [tokenData, authUser, callId, isAudioOnly, navigate]);

//   const handleMissed = useCallback(async () => {
//     try { await window.__streamCall?.leave(); } catch { /* silent */ }
//     try {
//       if (chatCh) {
//         await chatCh.sendMessage({
//           text: "Missed call", call_log: true,
//           call_type: isAudioOnly ? "voice" : "video",
//           call_duration: 0, call_missed: true,
//           call_direction: isCallerRef.current ? "outgoing" : "incoming",
//         });
//         await chatCh.sendEvent({ type: "call_ended", callId });
//       }
//     } catch { /* silent */ }
//     navigate(-1);
//   }, [chatCh, isAudioOnly, callId, navigate]);

//   const handleCallEnd = useCallback(async (duration) => {
//     try {
//       if (chatCh) {
//         await chatCh.sendMessage({
//           text: isAudioOnly ? "Voice call" : "Video call",
//           call_log: true,
//           call_type: isAudioOnly ? "voice" : "video",
//           call_duration: duration,
//           call_duration_str: duration > 0 ? fmtDur(duration) : "",
//           call_missed: false,
//           call_direction: isCallerRef.current ? "outgoing" : "incoming",
//         });
//         await chatCh.sendEvent({ type: "call_ended", callId });
//       }
//     } catch { /* silent */ }
//     navigate(-1);
//   }, [chatCh, isAudioOnly, callId, navigate]);

//   if (authLoading || busy) return <PageLoader />;

//   if (!videoClient || !call) return (
//     <div className="flex flex-col items-center justify-center gap-4 text-white"
//       style={{ height: "100dvh", background: "#0d1117" }}>
//       <PhoneOffIcon className="size-12" style={{ color: "#f87171" }} />
//       <p className="text-lg font-medium">Could not connect</p>
//       <button className="px-6 py-2.5 rounded-full text-white font-medium active:scale-95 mt-2"
//         style={{ background: "#00a884" }} onClick={() => window.location.reload()}>
//         Try Again
//       </button>
//       <button className="text-sm underline mt-1" style={{ color: "rgba(255,255,255,0.4)" }}
//         onClick={() => navigate(-1)}>Go back</button>
//     </div>
//   );
//   return (
//     <StreamVideo client={videoClient}>
//       <StreamCall call={call}>
//         <CallContent
//           isAudioOnly={isAudioOnly}
//           peerName={peerName || authUser?.fullName || ""}
//           peerImage={peerImage || authUser?.profilePic || ""}
//           onCallEnd={handleCallEnd}
//           onMissed={handleMissed}
//           call={call}
//         />
//       </StreamCall>
//     </StreamVideo>
//   );
// };

// export default CallPage;




import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import {
  StreamVideo, StreamVideoClient, StreamCall,
  CallingState, useCallStateHooks, ParticipantView,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import PageLoader from "../components/pageLoader.jsx";
import { PhoneOffIcon, MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, Volume2Icon, VolumeXIcon, RotateCcwIcon } from "lucide-react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;
const pad = n => String(n).padStart(2, "0");
const fmtDur = s => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60; return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`; };

/* ─── Timer ─── */
const Timer = ({ active, label }) => {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!active) { setSecs(0); return; }
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return active
    ? <span className="text-[13px] font-mono tracking-widest" style={{ color: "rgba(255,255,255,0.8)" }}>{fmtDur(secs)}</span>
    : <span className="text-[13px] animate-pulse" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>;
};

/* ─── Peer Avatar with rings ─── */
const PeerAvatar = ({ image, name, size = 120 }) => (
  <div className="relative flex items-center justify-center">
    <div className="absolute rounded-full" style={{ width: size * 1.75, height: size * 1.75, background: "rgba(0,200,150,0.06)", animation: "ringPulse 2.2s ease-in-out infinite" }} />
    <div className="absolute rounded-full" style={{ width: size * 1.38, height: size * 1.38, background: "rgba(0,200,150,0.1)", animation: "ringPulse 2.2s ease-in-out infinite", animationDelay: "0.55s" }} />
    <div className="relative z-10 rounded-full overflow-hidden shadow-2xl flex-shrink-0"
      style={{ width: size, height: size, border: "3px solid rgba(0,200,150,0.5)", boxShadow: "0 0 48px rgba(0,200,150,0.22)" }}>
      {image
        ? <img src={image} alt={name} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center font-bold text-white"
            style={{ fontSize: size * 0.38, background: "linear-gradient(135deg,#00c896,#025144)" }}>
            {name?.charAt(0)?.toUpperCase() || "?"}
          </div>}
    </div>
  </div>
);

/* ─── Control Button ─── */
const Btn = ({ active, activeColor = "#ef4444", onClick, children, label }) => (
  <div className="flex flex-col items-center gap-2">
    <button onClick={onClick} className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
      style={{ background: active ? `${activeColor}22` : "rgba(255,255,255,0.12)", border: `1.5px solid ${active ? `${activeColor}70` : "rgba(255,255,255,0.12)"}`, boxShadow: active ? `0 0 22px ${activeColor}33` : "none", backdropFilter: "blur(10px)" }}>
      {children}
    </button>
    {label && <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</span>}
  </div>
);

/* ─── Controls Bar ─── */
const Controls = ({ isAudioOnly, onEnd, call }) => {
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { microphone, isMute: micOff } = useMicrophoneState();
  const { camera, isMute: camOff } = useCameraState();

  // ✅ SPEAKER: Does NOT mute audio, only boosts/normalizes output volume
  // Default: volume 0.7 (earpiece feel), Speaker ON: volume 1.0 (loudspeaker)
  const [speakerOn, setSpeakerOn] = useState(false);
  const [facingMode, setFacingMode] = useState("user");

  // Ensure audio plays on mount at default volume
  useEffect(() => {
    const ensureAudio = () => {
      Array.from(document.querySelectorAll("audio, video")).forEach(el => {
        el.muted = false;
        el.volume = speakerOn ? 1.0 : 0.75; // Earpiece: 0.75, Speaker: 1.0
      });
    };
    ensureAudio();
    const obs = new MutationObserver(ensureAudio);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [speakerOn]);

  const toggleSpeaker = useCallback(() => {
    const next = !speakerOn;
    setSpeakerOn(next);
    // Apply volume change immediately — does NOT mute
    Array.from(document.querySelectorAll("audio, video")).forEach(el => {
      el.muted = false;
      el.volume = next ? 1.0 : 0.75;
      // On supported browsers, route to speaker/earpiece
      if (typeof el.setSinkId === "function") {
        el.setSinkId("default").catch(() => {});
      }
    });
  }, [speakerOn]);

  const switchCamera = useCallback(async () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    try { await call.camera.flip(); } catch { }
  }, [call, facingMode]);

  return (
    <div className="flex items-end justify-center gap-5 pb-10 pt-4 px-4">
      {/* Mic toggle — separate from speaker */}
      <Btn active={micOff} onClick={() => micOff ? microphone.enable() : microphone.disable()} label={micOff ? "Unmute" : "Mute"}>
        {micOff ? <MicOffIcon className="size-[22px]" style={{ color: "#f87171" }} /> : <MicIcon className="size-[22px] text-white" />}
      </Btn>

      {/* End call */}
      <div className="flex flex-col items-center gap-2">
        <button onClick={onEnd} className="w-[68px] h-[68px] rounded-full flex items-center justify-center active:scale-90 transition-all"
          style={{ background: "linear-gradient(135deg,#ef4444,#c0392b)", boxShadow: "0 0 32px rgba(239,68,68,0.55)" }}>
          <PhoneOffIcon className="size-7 text-white" />
        </button>
        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>End</span>
      </div>

      {!isAudioOnly ? (
        <>
          <Btn active={camOff} onClick={() => camOff ? camera.enable() : camera.disable()} label={camOff ? "Cam off" : "Camera"}>
            {camOff ? <VideoOffIcon className="size-[22px]" style={{ color: "#f87171" }} /> : <VideoIcon className="size-[22px] text-white" />}
          </Btn>
          <Btn active={false} onClick={switchCamera} label="Flip">
            <RotateCcwIcon className="size-5 text-white" />
          </Btn>
        </>
      ) : (
        /* ✅ Speaker: active = louder, inactive = normal earpiece volume. NOT mute. */
        <Btn active={speakerOn} activeColor="#00c896" onClick={toggleSpeaker} label={speakerOn ? "Speaker" : "Earpiece"}>
          {speakerOn
            ? <Volume2Icon className="size-[22px]" style={{ color: "#00c896" }} />
            : <VolumeXIcon className="size-[22px] text-white" />}
        </Btn>
      )}
    </div>
  );
};

/* ─── Call Content ─── */
const CallContent = ({ isAudioOnly, peerName, peerImage, peerId, onCallEnd, onMissed, call }) => {
  const { useCallCallingState, useParticipants, useLocalParticipant } = useCallStateHooks();
  const state = useCallCallingState();
  const participants = useParticipants();
  const local = useLocalParticipant();
  const navigate = useNavigate();

  const remotes = participants.filter(p => !p.isLocalParticipant);
  const iJoined = state === CallingState.JOINED;
  const bothConnected = iJoined && remotes.length > 0;
  const startRef = useRef(null);
  const missedRef = useRef(null);
  const missedFired = useRef(false);

  useEffect(() => {
    if (bothConnected && !startRef.current) { startRef.current = Date.now(); clearTimeout(missedRef.current); }
  }, [bothConnected]);

  useEffect(() => {
    if (!iJoined || bothConnected) return;
    missedRef.current = setTimeout(() => { if (!startRef.current && !missedFired.current) { missedFired.current = true; onMissed(); } }, 30000);
    return () => clearTimeout(missedRef.current);
  }, [iJoined, bothConnected, onMissed]);

  // ✅ After call ends → redirect to peer's chat
  useEffect(() => {
    if (state === CallingState.LEFT) {
      if (peerId) navigate(`/chat/${peerId}`, { replace: true });
      else navigate(-1);
    }
  }, [state, navigate, peerId]);

  if (state === CallingState.LEFT) return null;

  const statusLabel = bothConnected ? null : iJoined ? "Ringing..." : "Connecting...";
  const endCall = async () => {
    const dur = startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : 0;
    clearTimeout(missedRef.current);
    try { await window.__streamCall?.leave(); } catch { }
    onCallEnd(dur);
  };

  const BG = "linear-gradient(160deg,#060d18 0%,#0d1f2d 55%,#051510 100%)";

  if (isAudioOnly) return (
    <div className="flex flex-col" style={{ height: "100dvh", background: BG }}>
      <div className="absolute top-0 left-0 right-0 z-20 px-6" style={{ paddingTop: "max(20px,env(safe-area-inset-top,20px))", background: "linear-gradient(to bottom,rgba(0,0,0,0.65),transparent)" }}>
        <p className="text-white font-semibold text-[15px]">{peerName}</p>
        <Timer active={bothConnected} label={statusLabel || "Calling..."} />
      </div>
      {/* Hidden audio binders — ensure remote audio plays */}
      {remotes.map(p => <div key={p.sessionId} className="sr-only" aria-hidden><ParticipantView participant={p} trackType="audioTrack" /></div>)}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <PeerAvatar image={peerImage} name={peerName} size={130} />
        <div className="text-center mt-1">
          <p className="text-white text-2xl font-bold tracking-tight">{peerName}</p>
          <div className="mt-2"><Timer active={bothConnected} label={statusLabel || "Calling..."} /></div>
        </div>
      </div>
      <div style={{ background: "linear-gradient(to top,rgba(0,0,0,0.8) 60%,transparent)", paddingBottom: "env(safe-area-inset-bottom,16px)" }}>
        <Controls isAudioOnly call={call} onEnd={endCall} />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: "#060d18" }}>
      <div className="absolute top-0 left-0 right-0 z-20 px-5" style={{ paddingTop: "max(16px,env(safe-area-inset-top,16px))", paddingBottom: "60px", background: "linear-gradient(to bottom,rgba(0,0,0,0.72),transparent)" }}>
        <p className="text-white font-semibold text-[15px]">{peerName}</p>
        <Timer active={bothConnected} label={statusLabel || "Calling..."} />
      </div>
      <div className="flex-1 relative overflow-hidden">
        {remotes.length > 0
          ? <div className="w-full h-full"><ParticipantView participant={remotes[0]} className="w-full h-full object-cover" trackType="videoTrack" /></div>
          : <div className="w-full h-full flex flex-col items-center justify-center gap-4" style={{ background: BG }}>
              <PeerAvatar image={peerImage} name={peerName} size={112} />
              <p className="text-white text-xl font-semibold mt-2">{peerName}</p>
              <span className="text-sm animate-pulse" style={{ color: "rgba(255,255,255,0.38)" }}>{statusLabel}</span>
            </div>}
        {local && (
          <div className="absolute top-16 right-3 rounded-2xl overflow-hidden shadow-2xl z-10"
            style={{ width: 96, height: 140, border: "2px solid rgba(255,255,255,0.15)" }}>
            <ParticipantView participant={local} className="w-full h-full object-cover" trackType="videoTrack" mirror />
          </div>
        )}
      </div>
      <div style={{ background: "linear-gradient(to top,rgba(0,0,0,0.85) 60%,transparent)", paddingBottom: "env(safe-area-inset-bottom,12px)" }}>
        <Controls isAudioOnly={false} call={call} onEnd={endCall} />
      </div>
    </div>
  );
};

/* ─── Call Page ─── */
const CallPage = () => {
  const { id: callId } = useParams();
  const [sp] = useSearchParams();
  const isAudioOnly = sp.get("audio") === "true";

  const [videoClient, setVideoClient] = useState(null);
  const [call, setCall] = useState(null);
  const [busy, setBusy] = useState(true);
  const [peerName, setPeerName] = useState("");
  const [peerImage, setPeerImage] = useState("");
  const [peerId, setPeerId] = useState("");
  const [chatCh, setChatCh] = useState(null);
  const isCallerRef = useRef(false);
  const clientRef = useRef(null);
  const navigate = useNavigate();
  const { authUser, isLoading: authLoading } = useAuthUser();
  const { data: tokenData } = useQuery({ queryKey: ["streamToken"], queryFn: getStreamToken, enabled: !!authUser });

  useEffect(() => {
    if (!tokenData?.token || !authUser || !callId) return;
    let cancelled = false;
    (async () => {
      try {
        if (window.__streamVideoClient) { try { await window.__streamVideoClient.disconnectUser(); } catch { } window.__streamVideoClient = null; }
        const vc = new StreamVideoClient({ apiKey: STREAM_API_KEY, user: { id: authUser._id, name: authUser.fullName, image: authUser.profilePic }, token: tokenData.token });
        window.__streamVideoClient = vc; clientRef.current = vc;
        const ci = vc.call("default", callId); window.__streamCall = ci;

        try {
          const s = await navigator.mediaDevices.getUserMedia(isAudioOnly ? { audio: true } : { audio: true, video: true });
          s.getTracks().forEach(t => t.stop());
        } catch (permErr) {
          toast.error(permErr.name === "NotAllowedError" ? "Microphone access denied." : "Could not access microphone.", { duration: 5000 });
          if (!cancelled) setBusy(false); return;
        }

        if (isAudioOnly) await ci.camera.disable();
        await ci.join({ create: true });

        // ✅ Resolve peer: try call members first, then derive from callId
        let resolvedPeerId = callId.split("-").find(id => id !== authUser._id) || "";
        const membersMap = ci.state?.members || {};
        const otherMember = Object.values(membersMap).find(m => m.user_id !== authUser._id);
        if (otherMember?.user) {
          setPeerName(otherMember.user.name || "");
          setPeerImage(otherMember.user.image || "");
          resolvedPeerId = otherMember.user_id || resolvedPeerId;
        }
        setPeerId(resolvedPeerId);
        isCallerRef.current = !ci.state?.createdBy?.id || ci.state?.createdBy?.id === authUser._id;

        // Fallback: fetch peer info from StreamChat if still no name
        if (!peerName && resolvedPeerId) {
          try {
            const cc0 = StreamChat.getInstance(STREAM_API_KEY);
            if (!cc0.userID) await cc0.connectUser({ id: authUser._id, name: authUser.fullName, image: authUser.profilePic }, tokenData.token);
            const { users } = await cc0.queryUsers({ id: { $eq: resolvedPeerId } });
            if (users[0]) { setPeerName(users[0].name || ""); setPeerImage(users[0].image || ""); }
          } catch { }
        }

        // Chat channel for call log + events
        const cc = StreamChat.getInstance(STREAM_API_KEY);
        if (!cc.userID) await cc.connectUser({ id: authUser._id, name: authUser.fullName, image: authUser.profilePic }, tokenData.token);
        if (resolvedPeerId) {
          const ch = cc.channel("messaging", callId, { members: [authUser._id, resolvedPeerId] });
          await ch.watch();
          if (!cancelled) setChatCh(ch);
          ch.on((event) => {
            if (event.type === "call_rejected" && event.callId === callId) {
              ch.sendMessage({ text: "Missed call", call_log: true, call_type: isAudioOnly ? "voice" : "video", call_duration: 0, call_missed: true, call_direction: "outgoing" }).catch(() => {});
              navigate(`/chat/${resolvedPeerId}`, { replace: true });
            }
            if (event.type === "call_ended" && event.callId === callId) navigate(`/chat/${resolvedPeerId}`, { replace: true });
          });
        }
        if (!cancelled) { setVideoClient(vc); setCall(ci); }
      } catch (e) { console.error("Call join error:", e); toast.error("Could not connect to call."); }
      finally { if (!cancelled) setBusy(false); }
    })();
    return () => { cancelled = true; window.__streamCall = null; window.__streamVideoClient = null; clientRef.current?.disconnectUser().catch(() => {}); };
  }, [tokenData, authUser, callId, isAudioOnly]); // eslint-disable-line

  const handleMissed = useCallback(async () => {
    try { await window.__streamCall?.leave(); } catch { }
    try {
      if (chatCh) {
        await chatCh.sendMessage({ text: "Missed call", call_log: true, call_type: isAudioOnly ? "voice" : "video", call_duration: 0, call_missed: true, call_direction: isCallerRef.current ? "outgoing" : "incoming" });
        await chatCh.sendEvent({ type: "call_ended", callId });
      }
    } catch { }
    if (peerId) navigate(`/chat/${peerId}`, { replace: true }); else navigate(-1);
  }, [chatCh, isAudioOnly, callId, peerId, navigate]);

  const handleCallEnd = useCallback(async (duration) => {
    try {
      if (chatCh) {
        await chatCh.sendMessage({ text: isAudioOnly ? "Voice call" : "Video call", call_log: true, call_type: isAudioOnly ? "voice" : "video", call_duration: duration, call_missed: false, call_direction: isCallerRef.current ? "outgoing" : "incoming" });
        await chatCh.sendEvent({ type: "call_ended", callId });
      }
    } catch { }
    if (peerId) navigate(`/chat/${peerId}`, { replace: true }); else navigate(-1);
  }, [chatCh, isAudioOnly, callId, peerId, navigate]);

  if (authLoading || busy) return <PageLoader />;

  if (!videoClient || !call) return (
    <div className="flex flex-col items-center justify-center gap-4 text-white" style={{ height: "100dvh", background: "linear-gradient(160deg,#060d18,#0d1f2d)" }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)" }}>
        <PhoneOffIcon className="size-8" style={{ color: "#f87171" }} />
      </div>
      <p className="text-xl font-semibold mt-2">Could not connect</p>
      <button className="px-6 py-2.5 rounded-full font-medium active:scale-95 mt-2 text-white" style={{ background: "linear-gradient(135deg,#00c896,#0098d4)" }} onClick={() => window.location.reload()}>Try Again</button>
      <button className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }} onClick={() => peerId ? navigate(`/chat/${peerId}`, { replace: true }) : navigate(-1)}>Go back</button>
    </div>
  );

  return (
    <>
      <style>{`@keyframes ringPulse{0%,100%{transform:scale(1);opacity:0.7}50%{transform:scale(1.12);opacity:1}}`}</style>
      <StreamVideo client={videoClient}>
        <StreamCall call={call}>
          <CallContent isAudioOnly={isAudioOnly} peerName={peerName || "Connecting..."} peerImage={peerImage} peerId={peerId} onCallEnd={handleCallEnd} onMissed={handleMissed} call={call} />
        </StreamCall>
      </StreamVideo>
    </>
  );
};
export default CallPage;