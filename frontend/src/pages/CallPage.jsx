// // import { useEffect, useState, useRef } from "react";
// // import { useNavigate, useParams, useSearchParams } from "react-router";
// // import useAuthUser from "../hooks/useAuthUser";
// // import { useQuery } from "@tanstack/react-query";
// // import { getStreamToken } from "../lib/api";
// // import { StreamVideo, StreamVideoClient, StreamCall, StreamTheme, CallingState, useCallStateHooks } from "@stream-io/video-react-sdk";
// // import "@stream-io/video-react-sdk/dist/css/styles.css";
// // import { StreamChat } from "stream-chat";
// // import toast from "react-hot-toast";
// // import PageLoader from "../components/pageLoader.jsx";
// // import { PhoneOffIcon, MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, Volume2Icon, CameraIcon } from "lucide-react";

// // const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

// // /* — Call timer — */
// // const Timer = ({ on }) => {
// //   const [s, setS] = useState(0);
// //   useEffect(() => { if (!on) return; const id = setInterval(() => setS(x => x + 1), 1000); return () => clearInterval(id); }, [on]);
// //   if (!on) return <span className="text-white/50 text-sm">Calling...</span>;
// //   return <span className="text-white/60 text-sm font-mono">{String(Math.floor(s / 60)).padStart(2, "0")}:{String(s % 60).padStart(2, "0")}</span>;
// // };

// // /* — Controls — */
// // const Controls = ({ isAudioOnly, onEnd }) => {
// //   const { useMicrophoneState, useCameraState } = useCallStateHooks();
// //   const { microphone, isMute: micOff } = useMicrophoneState();
// //   const { camera, isMute: camOff } = useCameraState();
// //   const btn = (active, onClick, OnIcon, OffIcon, label) => (
// //     <div className="flex flex-col items-center gap-2">
// //       <button onClick={onClick} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg ${active ? "bg-red-500/25 border border-red-500/50" : "bg-white/15 hover:bg-white/25"}`}>
// //         {active ? <OffIcon className="size-6 text-red-400" /> : <OnIcon className="size-6 text-white" />}
// //       </button>
// //       <span className="text-[10px] text-white/40">{label}</span>
// //     </div>
// //   );
// //   return (
// //     <div className="flex items-center justify-center gap-8 py-8 px-4">
// //       {btn(micOff, () => micOff ? microphone.enable() : microphone.disable(), MicIcon, MicOffIcon, micOff ? "Unmute" : "Mute")}
// //       <div className="flex flex-col items-center gap-2">
// //         <button onClick={onEnd} className="w-[68px] h-[68px] rounded-full bg-red-500 hover:bg-red-600 active:scale-90 flex items-center justify-center shadow-xl shadow-red-500/40">
// //           <PhoneOffIcon className="size-7 text-white" />
// //         </button>
// //         <span className="text-[10px] text-white/40">End</span>
// //       </div>
// //       {!isAudioOnly
// //         ? btn(camOff, () => camOff ? camera.enable() : camera.disable(), VideoIcon, VideoOffIcon, camOff ? "Camera" : "Camera")
// //         : <div className="flex flex-col items-center gap-2"><button className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center active:scale-90"><Volume2Icon className="size-6 text-white" /></button><span className="text-[10px] text-white/40">Speaker</span></div>
// //       }
// //     </div>
// //   );
// // };

// // /* — Video tile — */
// // const Tile = ({ participant, isLocal }) => {
// //   const vr = useRef(null);
// //   useEffect(() => { if (vr.current && participant?.videoStream) vr.current.srcObject = participant.videoStream; }, [participant?.videoStream]);
// //   const name = participant?.name || (isLocal ? "You" : "...");
// //   const hasV = !!participant?.videoStream;
// //   return (
// //     <div className="relative w-full h-full bg-[#1a2630] rounded-xl overflow-hidden flex items-center justify-center">
// //       {hasV ? <video ref={vr} autoPlay playsInline muted={isLocal} className="w-full h-full object-cover" />
// //         : <div className="flex flex-col items-center gap-3">
// //             <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00a884] to-[#025144] flex items-center justify-center text-3xl font-bold text-white">{name.charAt(0).toUpperCase()}</div>
// //             <p className="text-white/50 text-sm">{name}</p>
// //           </div>}
// //       <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[11px]">{isLocal ? "You" : name}</div>
// //     </div>
// //   );
// // };

// // /* — Call content — */
// // const CallContent = ({ isAudioOnly, callerName, onCallEnd }) => {
// //   const { useCallCallingState, useParticipants, useLocalParticipant } = useCallStateHooks();
// //   const state = useCallCallingState();
// //   const participants = useParticipants();
// //   const local = useLocalParticipant();
// //   const navigate = useNavigate();
// //   const remotes = participants.filter(p => !p.isLocalParticipant);
// //   const joined = state === CallingState.JOINED;
// //   const connecting = state === CallingState.JOINING || state === CallingState.RINGING;
// //   const startTime = useRef(null);

// //   useEffect(() => { if (joined && !startTime.current) startTime.current = Date.now(); }, [joined]);
// //   useEffect(() => { if (state === CallingState.LEFT) navigate("/"); }, [state, navigate]);
// //   if (state === CallingState.LEFT) return null;

// //   const endCall = async () => {
// //     const dur = startTime.current ? Math.round((Date.now() - startTime.current) / 1000) : 0;
// //     try { await window.__callRef?.leave(); } catch { /* silent */ }
// //     onCallEnd(dur);
// //   };

// //   return (
// //     <div className="flex flex-col" style={{ height: "100dvh", background: "#0d1117" }}>
// //       {/* Top bar */}
// //       <div className="absolute top-0 left-0 right-0 z-20 px-4 pb-3 bg-gradient-to-b from-black/70 to-transparent" style={{ paddingTop: "max(16px,env(safe-area-inset-top))" }}>
// //         <p className="text-white font-semibold text-base">{callerName}</p>
// //         <Timer on={joined} />
// //       </div>

// //       {/* Media area */}
// //       <div className="flex-1 relative overflow-hidden">
// //         {isAudioOnly ? (
// //           /* Voice UI */
// //           <div className="w-full h-full flex flex-col items-center justify-center gap-6" style={{ background: "linear-gradient(160deg,#1a2630,#0d1117)" }}>
// //             <div className="relative flex items-center justify-center">
// //               <div className="absolute w-44 h-44 rounded-full border border-[#00a884]/20 animate-ping" style={{ animationDuration: "2s" }} />
// //               <div className="absolute w-56 h-56 rounded-full border border-[#00a884]/10 animate-ping" style={{ animationDuration: "2.6s", animationDelay: "0.3s" }} />
// //               <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#00a884] to-[#025144] flex items-center justify-center text-5xl font-bold text-white shadow-2xl ring-4 ring-[#00a884]/20">
// //                 {callerName?.charAt(0)?.toUpperCase() || "?"}
// //               </div>
// //             </div>
// //             <div className="text-center">
// //               <p className="text-white text-2xl font-semibold">{callerName}</p>
// //               <div className="mt-2"><Timer on={joined} /></div>
// //             </div>
// //           </div>
// //         ) : (
// //           /* Video UI */
// //           <div className="w-full h-full">
// //             {remotes.length > 0
// //               ? <Tile participant={remotes[0]} isLocal={false} />
// //               : <div className="w-full h-full flex flex-col items-center justify-center gap-4" style={{ background: "linear-gradient(160deg,#1a2630,#0d1117)" }}>
// //                   <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#00a884] to-[#025144] flex items-center justify-center text-4xl font-bold text-white">{callerName?.charAt(0)?.toUpperCase()}</div>
// //                   <p className="text-white text-xl">{callerName}</p>
// //                   <p className="text-white/40 text-sm">{connecting ? "Calling..." : "Waiting..."}</p>
// //                 </div>
// //             }
// //             {/* PiP */}
// //             {local && <div className="absolute top-16 right-4 w-24 h-36 sm:w-32 sm:h-48 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-10"><Tile participant={local} isLocal /></div>}
// //             {/* Flip btn */}
// //             <button className="absolute bottom-36 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center z-10 border border-white/20 active:scale-90"><CameraIcon className="size-5 text-white" /></button>
// //           </div>
// //         )}
// //       </div>

// //       {/* Controls */}
// //       <div className="shrink-0" style={{ background: "linear-gradient(to top, #0d1117, transparent)", paddingBottom: "env(safe-area-inset-bottom,16px)" }}>
// //         <Controls isAudioOnly={isAudioOnly} onEnd={endCall} />
// //       </div>
// //     </div>
// //   );
// // };

// // /* ═══════════ CallPage ═══════════ */
// // const CallPage = () => {
// //   const { id: callId } = useParams();
// //   const [sp] = useSearchParams();
// //   const isAudioOnly = sp.get("audio") === "true";
// //   const [vc, setVc] = useState(null);
// //   const [call, setCall] = useState(null);
// //   const [busy, setBusy] = useState(true);
// //   const [callerName, setCallerName] = useState("");
// //   const [chatChannel, setChatChannel] = useState(null);
// //   const clientRef = useRef(null);
// //   const navigate = useNavigate();
// //   const { authUser, isLoading: al } = useAuthUser();
// //   const { data: td } = useQuery({ queryKey: ["streamToken"], queryFn: getStreamToken, enabled: !!authUser });

// //   useEffect(() => {
// //     if (!td?.token || !authUser || !callId) return;
// //     (async () => {
// //       try {
// //         // Video client
// //         const vc2 = new StreamVideoClient({ apiKey: STREAM_API_KEY, user: { id: authUser._id, name: authUser.fullName, image: authUser.profilePic }, token: td.token });
// //         clientRef.current = vc2;
// //         const ci = vc2.call("default", callId);
// //         if (isAudioOnly) await ci.camera.disable();
// //         await ci.join({ create: true });
// //         window.__callRef = ci;
// //         const members = ci.state?.members || {};
// //         const other = Object.values(members).find(m => m.user_id !== authUser._id);
// //         if (other?.user) setCallerName(other.user.name || "");
// //         setVc(vc2); setCall(ci);

// //         // Chat client for call log message
// //         const cc = StreamChat.getInstance(STREAM_API_KEY);
// //         if (cc.userID !== authUser._id) await cc.connectUser({ id: authUser._id, name: authUser.fullName, image: authUser.profilePic }, td.token);
// //         const targetId = callId.split("-").find(id => id !== authUser._id);
// //         if (targetId) {
// //           const ch = cc.channel("messaging", callId, { members: [authUser._id, targetId] });
// //           await ch.watch();
// //           setChatChannel(ch);
// //         }
// //       } catch (e) { console.error(e); toast.error("Could not join."); }
// //       finally { setBusy(false); }
// //     })();
// //     return () => { window.__callRef = null; clientRef.current?.disconnectUser().catch(() => {}); };
// //   }, [td, authUser, callId, isAudioOnly]);

// //   // Called when user ends the call — send call log message
// //   const handleCallEnd = async (duration) => {
// //     try {
// //       if (chatChannel) {
// //         await chatChannel.sendMessage({
// //           text: isAudioOnly ? "Voice call" : "Video call",
// //           call_log: true,
// //           call_type: isAudioOnly ? "voice" : "video",
// //           call_duration: duration,
// //         });
// //       }
// //     } catch { /* silent */ }
// //     navigate(-1);
// //   };

// //   if (al || busy) return <PageLoader />;

// //   if (!vc || !call) return (
// //     <div className="flex flex-col items-center justify-center gap-4 text-white" style={{ height: "100dvh", background: "#0d1117" }}>
// //       <PhoneOffIcon className="size-12 text-red-400" />
// //       <p className="text-lg font-medium">Could not connect</p>
// //       <button className="px-6 py-2.5 bg-[#00a884] rounded-full text-white font-medium active:scale-95" onClick={() => window.location.reload()}>Try Again</button>
// //       <button className="text-white/40 text-sm underline mt-1" onClick={() => navigate(-1)}>Go back</button>
// //     </div>
// //   );

// //   return (
// //     <StreamVideo client={vc}>
// //       <StreamCall call={call}>
// //         <StreamTheme>
// //           <CallContent isAudioOnly={isAudioOnly} callerName={callerName || authUser?.fullName} onCallEnd={handleCallEnd} />
// //         </StreamTheme>
// //       </StreamCall>
// //     </StreamVideo>
// //   );
// // };

// // export default CallPage;



// import { useEffect, useState, useRef } from "react";
// import { useNavigate, useParams, useSearchParams } from "react-router";
// import useAuthUser from "../hooks/useAuthUser";
// import { useQuery } from "@tanstack/react-query";
// import { getStreamToken } from "../lib/api";
// import { StreamVideo, StreamVideoClient, StreamCall, StreamTheme, CallingState, useCallStateHooks } from "@stream-io/video-react-sdk";
// import "@stream-io/video-react-sdk/dist/css/styles.css";
// import { StreamChat } from "stream-chat";
// import toast from "react-hot-toast";
// import PageLoader from "../components/pageLoader.jsx";
// import { PhoneOffIcon, MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, Volume2Icon, CameraIcon } from "lucide-react";

// const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

// /* — Timer — */
// const Timer = ({ on }) => {
//   const [s, setS] = useState(0);
//   useEffect(() => {
//     if (!on) return;
//     const id = setInterval(() => setS(x => x + 1), 1000);
//     return () => clearInterval(id);
//   }, [on]);
//   if (!on) return <span className="text-white/50 text-sm">Calling...</span>;
//   return <span className="text-white/60 text-sm font-mono">{String(Math.floor(s / 60)).padStart(2, "0")}:{String(s % 60).padStart(2, "0")}</span>;
// };

// /* — Controls — */
// const Controls = ({ isAudioOnly, onEnd }) => {
//   const { useMicrophoneState, useCameraState } = useCallStateHooks();
//   const { microphone, isMute: micOff } = useMicrophoneState();
//   const { camera, isMute: camOff } = useCameraState();

//   const Btn = ({ active, onClick, On, Off, label }) => (
//     <div className="flex flex-col items-center gap-2">
//       <button onClick={onClick} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg ${active ? "bg-red-500/25 border border-red-500/50" : "bg-white/15 hover:bg-white/25"}`}>
//         {active ? <Off className="size-6 text-red-400" /> : <On className="size-6 text-white" />}
//       </button>
//       <span className="text-[10px] text-white/40">{label}</span>
//     </div>
//   );

//   return (
//     <div className="flex items-center justify-center gap-8 py-8 px-4">
//       <Btn active={micOff} onClick={() => micOff ? microphone.enable() : microphone.disable()} On={MicIcon} Off={MicOffIcon} label={micOff ? "Unmute" : "Mute"} />
//       <div className="flex flex-col items-center gap-2">
//         <button onClick={onEnd} className="w-[68px] h-[68px] rounded-full bg-red-500 hover:bg-red-600 active:scale-90 flex items-center justify-center shadow-xl shadow-red-500/40 transition-all">
//           <PhoneOffIcon className="size-7 text-white" />
//         </button>
//         <span className="text-[10px] text-white/40">End</span>
//       </div>
//       {!isAudioOnly
//         ? <Btn active={camOff} onClick={() => camOff ? camera.enable() : camera.disable()} On={VideoIcon} Off={VideoOffIcon} label="Camera" />
//         : <div className="flex flex-col items-center gap-2">
//             <button className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center active:scale-90 shadow-lg"><Volume2Icon className="size-6 text-white" /></button>
//             <span className="text-[10px] text-white/40">Speaker</span>
//           </div>
//       }
//     </div>
//   );
// };

// /* — Video tile — */
// const Tile = ({ participant, isLocal }) => {
//   const vr = useRef(null);
//   useEffect(() => { if (vr.current && participant?.videoStream) vr.current.srcObject = participant.videoStream; }, [participant?.videoStream]);
//   const name = participant?.name || (isLocal ? "You" : "...");
//   return (
//     <div className="relative w-full h-full bg-[#1a2630] rounded-xl overflow-hidden flex items-center justify-center">
//       {participant?.videoStream
//         ? <video ref={vr} autoPlay playsInline muted={isLocal} className="w-full h-full object-cover" />
//         : <div className="flex flex-col items-center gap-3">
//             <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00a884] to-[#025144] flex items-center justify-center text-3xl font-bold text-white">{name.charAt(0).toUpperCase()}</div>
//             <p className="text-white/50 text-sm">{name}</p>
//           </div>
//       }
//       <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[11px]">{isLocal ? "You" : name}</div>
//     </div>
//   );
// };

// /* — Call content — */
// const CallContent = ({ isAudioOnly, callerName, onCallEnd }) => {
//   const { useCallCallingState, useParticipants, useLocalParticipant } = useCallStateHooks();
//   const state = useCallCallingState();
//   const participants = useParticipants();
//   const local = useLocalParticipant();
//   const navigate = useNavigate();
//   const remotes = participants.filter(p => !p.isLocalParticipant);
//   const joined = state === CallingState.JOINED;
//   const connecting = state === CallingState.JOINING || state === CallingState.RINGING;
//   const startTime = useRef(null);

//   useEffect(() => { if (joined && !startTime.current) startTime.current = Date.now(); }, [joined]);
//   useEffect(() => { if (state === CallingState.LEFT) navigate("/"); }, [state, navigate]);
//   if (state === CallingState.LEFT) return null;

//   const endCall = async () => {
//     const dur = startTime.current ? Math.round((Date.now() - startTime.current) / 1000) : 0;
//     try { await window.__callRef?.leave(); } catch { /* silent */ }
//     onCallEnd(dur);
//   };

//   return (
//     <div className="flex flex-col" style={{ height: "100dvh", background: "#0d1117" }}>
//       {/* Top overlay */}
//       <div className="absolute top-0 left-0 right-0 z-20 px-4 pb-3 bg-gradient-to-b from-black/70 to-transparent"
//         style={{ paddingTop: "max(16px, env(safe-area-inset-top, 16px))" }}>
//         <p className="text-white font-semibold text-base">{callerName}</p>
//         <Timer on={joined} />
//       </div>

//       {/* Media */}
//       <div className="flex-1 relative overflow-hidden">
//         {isAudioOnly ? (
//           <div className="w-full h-full flex flex-col items-center justify-center gap-6" style={{ background: "linear-gradient(160deg,#1a2630,#0d1117)" }}>
//             <div className="relative flex items-center justify-center">
//               <div className="absolute w-44 h-44 rounded-full border border-[#00a884]/20 animate-ping" style={{ animationDuration: "2s" }} />
//               <div className="absolute w-56 h-56 rounded-full border border-[#00a884]/10 animate-ping" style={{ animationDuration: "2.6s", animationDelay: "0.3s" }} />
//               <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#00a884] to-[#025144] flex items-center justify-center text-5xl font-bold text-white shadow-2xl ring-4 ring-[#00a884]/20">
//                 {callerName?.charAt(0)?.toUpperCase() || "?"}
//               </div>
//             </div>
//             <div className="text-center">
//               <p className="text-white text-2xl font-semibold">{callerName}</p>
//               <div className="mt-2"><Timer on={joined} /></div>
//             </div>
//           </div>
//         ) : (
//           <div className="w-full h-full">
//             {remotes.length > 0
//               ? <Tile participant={remotes[0]} isLocal={false} />
//               : <div className="w-full h-full flex flex-col items-center justify-center gap-4" style={{ background: "linear-gradient(160deg,#1a2630,#0d1117)" }}>
//                   <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#00a884] to-[#025144] flex items-center justify-center text-4xl font-bold text-white">{callerName?.charAt(0)?.toUpperCase()}</div>
//                   <p className="text-white text-xl">{callerName}</p>
//                   <p className="text-white/40 text-sm">{connecting ? "Calling..." : "Waiting..."}</p>
//                 </div>
//             }
//             {local && (
//               <div className="absolute top-16 right-4 w-24 h-36 sm:w-32 sm:h-48 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-10">
//                 <Tile participant={local} isLocal />
//               </div>
//             )}
//             <button className="absolute bottom-36 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center z-10 border border-white/20 active:scale-90">
//               <CameraIcon className="size-5 text-white" />
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Controls */}
//       <div className="flex-shrink-0" style={{ background: "linear-gradient(to top,#0d1117,transparent)", paddingBottom: "env(safe-area-inset-bottom,16px)" }}>
//         <Controls isAudioOnly={isAudioOnly} onEnd={endCall} />
//       </div>
//     </div>
//   );
// };

// /* ══════════════ CallPage ══════════════ */
// const CallPage = () => {
//   const { id: callId } = useParams();
//   const [sp] = useSearchParams();
//   const isAudioOnly = sp.get("audio") === "true";
//   const [vc, setVc] = useState(null);
//   const [call, setCall] = useState(null);
//   const [busy, setBusy] = useState(true);
//   const [callerName, setCallerName] = useState("");
//   const [chatCh, setChatCh] = useState(null);
//   const clientRef = useRef(null);
//   const navigate = useNavigate();
//   const { authUser, isLoading: al } = useAuthUser();
//   const { data: td } = useQuery({ queryKey: ["streamToken"], queryFn: getStreamToken, enabled: !!authUser });

//   useEffect(() => {
//     if (!td?.token || !authUser || !callId) return;
//     (async () => {
//       try {
//         const vc2 = new StreamVideoClient({ apiKey: STREAM_API_KEY, user: { id: authUser._id, name: authUser.fullName, image: authUser.profilePic }, token: td.token });
//         clientRef.current = vc2;
//         const ci = vc2.call("default", callId);
//         if (isAudioOnly) await ci.camera.disable();
//         await ci.join({ create: true });
//         window.__callRef = ci;
//         const members = ci.state?.members || {};
//         const other = Object.values(members).find(m => m.user_id !== authUser._id);
//         if (other?.user) setCallerName(other.user.name || "");
//         setVc(vc2); setCall(ci);

//         // Chat channel for call log
//         const cc = StreamChat.getInstance(STREAM_API_KEY);
//         if (cc.userID !== authUser._id)
//           await cc.connectUser({ id: authUser._id, name: authUser.fullName, image: authUser.profilePic }, td.token);
//         const targetId = callId.split("-").find(id => id !== authUser._id);
//         if (targetId) {
//           const ch = cc.channel("messaging", callId, { members: [authUser._id, targetId] });
//           await ch.watch();
//           setChatCh(ch);
//         }
//       } catch (e) { console.error(e); toast.error("Could not join."); }
//       finally { setBusy(false); }
//     })();
//     return () => { window.__callRef = null; clientRef.current?.disconnectUser().catch(() => {}); };
//   }, [td, authUser, callId, isAudioOnly]);

//   const handleCallEnd = async (duration) => {
//     try {
//       if (chatCh) {
//         await chatCh.sendMessage({
//           text: isAudioOnly ? "Voice call" : "Video call",
//           call_log: true,
//           call_type: isAudioOnly ? "voice" : "video",
//           call_duration: duration,
//         });
//       }
//     } catch { /* silent */ }
//     navigate(-1);
//   };

//   if (al || busy) return <PageLoader />;

//   if (!vc || !call) return (
//     <div className="flex flex-col items-center justify-center gap-4 text-white" style={{ height: "100dvh", background: "#0d1117" }}>
//       <PhoneOffIcon className="size-12 text-red-400" />
//       <p className="text-lg font-medium">Could not connect</p>
//       <button className="px-6 py-2.5 bg-[#00a884] rounded-full text-white font-medium active:scale-95 mt-2" onClick={() => window.location.reload()}>Try Again</button>
//       <button className="text-white/40 text-sm underline mt-1" onClick={() => navigate(-1)}>Go back</button>
//     </div>
//   );

//   return (
//     <StreamVideo client={vc}>
//       <StreamCall call={call}>
//         <StreamTheme>
//           <CallContent isAudioOnly={isAudioOnly} callerName={callerName || authUser?.fullName} onCallEnd={handleCallEnd} />
//         </StreamTheme>
//       </StreamCall>
//     </StreamVideo>
//   );
// };

// export default CallPage;




/**
 * CallPage.jsx — WhatsApp-style voice & video call
 * Features: call timer, mute/camera toggle, PiP video,
 *           pulse rings for voice, call log sent on end,
 *           no call links in chat, clean navigation
 */

import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import {
  StreamVideo, StreamVideoClient, StreamCall,
  StreamTheme, CallingState, useCallStateHooks,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import PageLoader from "../components/pageLoader.jsx";
import {
  PhoneOffIcon, MicIcon, MicOffIcon,
  VideoIcon, VideoOffIcon, Volume2Icon,
  RotateCcwIcon, ArrowLeftIcon,
} from "lucide-react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

/* ══════════════════════════════════
   CALL TIMER
══════════════════════════════════ */
const Timer = ({ active }) => {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setS(x => x + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return (
    <span className="text-sm animate-pulse" style={{ color: "rgba(255,255,255,0.55)" }}>
      Calling...
    </span>
  );
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return <span className="text-sm font-mono" style={{ color: "rgba(255,255,255,0.65)" }}>{mm}:{ss}</span>;
};

/* ══════════════════════════════════
   CONTROL BUTTON
══════════════════════════════════ */
const CtrlBtn = ({ active, onClick, ActiveIcon, Icon, label, size = 14 }) => (
  <div className="flex flex-col items-center gap-2">
    <button onClick={onClick}
      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md
        ${active ? "border border-red-500/50" : "hover:opacity-80"}`}
      style={{ background: active ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.15)" }}>
      {active
        ? <ActiveIcon className={`size-${size}`} style={{ color: "#f87171" }} />
        : <Icon className={`size-${size} text-white`} />}
    </button>
    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
  </div>
);

/* ══════════════════════════════════
   CONTROLS BAR
══════════════════════════════════ */
const Controls = ({ isAudioOnly, onEnd }) => {
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { microphone, isMute: micOff } = useMicrophoneState();
  const { camera, isMute: camOff } = useCameraState();
  return (
    <div className="flex items-center justify-center gap-7 py-8 px-6">
      <CtrlBtn
        active={micOff}
        onClick={() => micOff ? microphone.enable() : microphone.disable()}
        Icon={MicIcon} ActiveIcon={MicOffIcon}
        label={micOff ? "Unmute" : "Mute"}
      />
      {/* End call */}
      <div className="flex flex-col items-center gap-2">
        <button onClick={onEnd}
          className="w-[70px] h-[70px] rounded-full flex items-center justify-center transition-all active:scale-90 shadow-2xl"
          style={{ background: "#ef4444", boxShadow: "0 0 32px rgba(239,68,68,0.45)" }}>
          <PhoneOffIcon className="size-7 text-white" />
        </button>
        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>End</span>
      </div>
      {!isAudioOnly ? (
        <CtrlBtn
          active={camOff}
          onClick={() => camOff ? camera.enable() : camera.disable()}
          Icon={VideoIcon} ActiveIcon={VideoOffIcon}
          label={camOff ? "Cam off" : "Camera"}
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <button className="w-14 h-14 rounded-full flex items-center justify-center active:scale-90 shadow-md"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <Volume2Icon className="size-6 text-white" />
          </button>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Speaker</span>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════
   VIDEO TILE
══════════════════════════════════ */
const Tile = ({ participant, isLocal }) => {
  const vr = useRef(null);
  useEffect(() => {
    if (vr.current && participant?.videoStream)
      vr.current.srcObject = participant.videoStream;
  }, [participant?.videoStream]);

  const name = participant?.name || (isLocal ? "You" : "...");
  const hasVideo = !!participant?.videoStream;

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center"
      style={{ background: "#1a2630", borderRadius: isLocal ? "12px" : "0px" }}>
      {hasVideo
        ? <video ref={vr} autoPlay playsInline muted={isLocal} className="w-full h-full object-cover" />
        : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-xl"
              style={{ background: "linear-gradient(135deg, #00a884, #025144)" }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{name}</p>
          </div>
        )
      }
      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-white text-[11px]"
        style={{ background: "rgba(0,0,0,0.5)" }}>
        {isLocal ? "You" : name}
      </div>
    </div>
  );
};

/* ══════════════════════════════════
   CALL CONTENT  (inside StreamCall)
══════════════════════════════════ */
const CallContent = ({ isAudioOnly, callerName, onCallEnd }) => {
  const { useCallCallingState, useParticipants, useLocalParticipant } = useCallStateHooks();
  const state = useCallCallingState();
  const participants = useParticipants();
  const local = useLocalParticipant();
  const navigate = useNavigate();
  const startTime = useRef(null);

  const joined = state === CallingState.JOINED;
  const connecting = state === CallingState.JOINING || state === CallingState.RINGING;
  const remotes = participants.filter(p => !p.isLocalParticipant);

  useEffect(() => { if (joined && !startTime.current) startTime.current = Date.now(); }, [joined]);
  useEffect(() => { if (state === CallingState.LEFT) navigate("/"); }, [state, navigate]);
  if (state === CallingState.LEFT) return null;

  const endCall = async () => {
    const dur = startTime.current ? Math.round((Date.now() - startTime.current) / 1000) : 0;
    try { await window.__callRef?.leave(); } catch { /* silent */ }
    onCallEnd(dur);
  };

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "100dvh", background: "#0d1117" }}>

      {/* Top bar — absolute overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 pb-4"
        style={{
          paddingTop: "max(16px, env(safe-area-inset-top, 16px))",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
        }}>
        <button onClick={endCall} className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeftIcon className="size-5" />
        </button>
        <div>
          <p className="text-white font-semibold text-[15px] leading-tight">{callerName || "Call"}</p>
          <Timer active={joined} />
        </div>
      </div>

      {/* ── Media area ── */}
      <div className="flex-1 relative overflow-hidden">

        {isAudioOnly ? (
          /* ── VOICE CALL UI ── */
          <div className="w-full h-full flex flex-col items-center justify-center gap-7"
            style={{ background: "linear-gradient(160deg, #1a2630 0%, #0d1117 100%)" }}>
            {/* Pulse rings */}
            <div className="relative flex items-center justify-center">
              {[1, 2, 3].map(i => (
                <div key={i}
                  className="absolute rounded-full border"
                  style={{
                    width: `${88 + i * 44}px`,
                    height: `${88 + i * 44}px`,
                    borderColor: `rgba(0,168,132,${0.22 - i * 0.06})`,
                    animation: `pulsering ${1.6 + i * 0.4}s ease-out infinite`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              ))}
              {/* Avatar */}
              <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-2xl z-10"
                style={{
                  background: "linear-gradient(135deg, #00a884 0%, #025144 100%)",
                  boxShadow: "0 0 40px rgba(0,168,132,0.3)",
                }}>
                {callerName?.charAt(0)?.toUpperCase() || "?"}
              </div>
            </div>
            <div className="text-center">
              <p className="text-white text-2xl font-semibold">{callerName || "Unknown"}</p>
              <div className="mt-2">
                {connecting
                  ? <span className="text-sm animate-pulse" style={{ color: "rgba(255,255,255,0.5)" }}>Calling...</span>
                  : <Timer active={joined} />
                }
              </div>
            </div>
          </div>
        ) : (
          /* ── VIDEO CALL UI ── */
          <div className="w-full h-full">
            {/* Remote full-screen */}
            {remotes.length > 0
              ? <Tile participant={remotes[0]} isLocal={false} />
              : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-5"
                  style={{ background: "linear-gradient(160deg, #1a2630 0%, #0d1117 100%)" }}>
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl"
                    style={{ background: "linear-gradient(135deg, #00a884, #025144)" }}>
                    {callerName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="text-center">
                    <p className="text-white text-xl font-medium">{callerName}</p>
                    <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {connecting ? "Calling..." : "Waiting for other person..."}
                    </p>
                  </div>
                </div>
              )
            }

            {/* PiP — local video */}
            {local && (
              <div className="absolute top-20 right-4 shadow-2xl z-20"
                style={{ width: 90, height: 140, borderRadius: 14, overflow: "hidden", border: "2px solid rgba(255,255,255,0.2)" }}>
                <Tile participant={local} isLocal />
              </div>
            )}

            {/* Flip camera */}
            <button className="absolute z-20 active:scale-90 transition-all flex items-center justify-center rounded-full border"
              style={{ bottom: 130, right: 16, width: 42, height: 42, background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)" }}>
              <RotateCcwIcon className="size-5 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="flex-shrink-0"
        style={{
          background: "linear-gradient(to top, rgba(13,17,23,0.98) 70%, transparent)",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}>
        <Controls isAudioOnly={isAudioOnly} onEnd={endCall} />
      </div>

      {/* Pulse ring keyframes */}
      <style>{`
        @keyframes pulsering {
          0% { transform: scale(0.95); opacity: 0.7; }
          70% { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(1.15); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

/* ══════════════════════════════════
   CALL PAGE
══════════════════════════════════ */
const CallPage = () => {
  const { id: callId } = useParams();
  const [sp] = useSearchParams();
  const isAudioOnly = sp.get("audio") === "true";
  const [vc, setVc] = useState(null);
  const [call, setCall] = useState(null);
  const [busy, setBusy] = useState(true);
  const [callerName, setCallerName] = useState("");
  const [chatCh, setChatCh] = useState(null);
  const clientRef = useRef(null);
  const navigate = useNavigate();
  const { authUser, isLoading: al } = useAuthUser();
  const { data: td } = useQuery({ queryKey: ["streamToken"], queryFn: getStreamToken, enabled: !!authUser });

  useEffect(() => {
    if (!td?.token || !authUser || !callId) return;
    (async () => {
      try {
        // Video client
        const vc2 = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: { id: authUser._id, name: authUser.fullName, image: authUser.profilePic },
          token: td.token,
        });
        clientRef.current = vc2;
        const ci = vc2.call("default", callId);
        if (isAudioOnly) await ci.camera.disable();
        await ci.join({ create: true });
        window.__callRef = ci;

        // Get other person's name
        const members = ci.state?.members || {};
        const other = Object.values(members).find(m => m.user_id !== authUser._id);
        if (other?.user) setCallerName(other.user.name || "");
        setVc(vc2); setCall(ci);

        // Chat channel — for sending call log after call ends
        const cc = StreamChat.getInstance(STREAM_API_KEY);
        if (cc.userID !== authUser._id)
          await cc.connectUser({ id: authUser._id, name: authUser.fullName, image: authUser.profilePic }, td.token);
        const targetId = callId.split("-").find(id => id !== authUser._id);
        if (targetId) {
          const ch = cc.channel("messaging", callId, { members: [authUser._id, targetId] });
          await ch.watch();
          setChatCh(ch);
        }
      } catch (e) { console.error(e); toast.error("Could not join the call."); }
      finally { setBusy(false); }
    })();
    return () => { window.__callRef = null; clientRef.current?.disconnectUser().catch(() => {}); };
  }, [td, authUser, callId, isAudioOnly]);

  // After call ends — send WhatsApp-style call log to chat, then go back
  const handleCallEnd = async (duration) => {
    try {
      if (chatCh) {
        await chatCh.sendMessage({
          text: isAudioOnly ? "Voice call" : "Video call",
          call_log: true,
          call_type: isAudioOnly ? "voice" : "video",
          call_duration: duration,
        });
      }
    } catch { /* silent — never crash on log failure */ }
    navigate(-1);
  };

  if (al || busy) return <PageLoader />;

  if (!vc || !call) return (
    <div className="flex flex-col items-center justify-center gap-4 text-white"
      style={{ height: "100dvh", background: "#0d1117" }}>
      <PhoneOffIcon className="size-14" style={{ color: "#f87171" }} />
      <p className="text-lg font-semibold">Could not connect</p>
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Check your connection and try again</p>
      <button onClick={() => window.location.reload()}
        className="mt-2 px-8 py-3 rounded-full font-semibold text-white active:scale-95 transition-all"
        style={{ background: "#00a884" }}>
        Try Again
      </button>
      <button onClick={() => navigate(-1)} className="text-sm underline mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
        Go back
      </button>
    </div>
  );

  return (
    <StreamVideo client={vc}>
      <StreamCall call={call}>
        <StreamTheme>
          <CallContent
            isAudioOnly={isAudioOnly}
            callerName={callerName || authUser?.fullName}
            onCallEnd={handleCallEnd}
          />
        </StreamTheme>
      </StreamCall>
    </StreamVideo>
  );
};

export default CallPage;