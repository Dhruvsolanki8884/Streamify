import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import { StreamVideo, StreamVideoClient, StreamCall, StreamTheme, CallingState, useCallStateHooks } from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import PageLoader from "../components/pageLoader.jsx";
import { PhoneOffIcon, MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, Volume2Icon, CameraIcon } from "lucide-react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

/* — Call timer — */
const Timer = ({ on }) => {
  const [s, setS] = useState(0);
  useEffect(() => { if (!on) return; const id = setInterval(() => setS(x => x + 1), 1000); return () => clearInterval(id); }, [on]);
  if (!on) return <span className="text-white/50 text-sm">Calling...</span>;
  return <span className="text-white/60 text-sm font-mono">{String(Math.floor(s / 60)).padStart(2, "0")}:{String(s % 60).padStart(2, "0")}</span>;
};

/* — Controls — */
const Controls = ({ isAudioOnly, onEnd }) => {
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { microphone, isMute: micOff } = useMicrophoneState();
  const { camera, isMute: camOff } = useCameraState();
  const btn = (active, onClick, OnIcon, OffIcon, label) => (
    <div className="flex flex-col items-center gap-2">
      <button onClick={onClick} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg ${active ? "bg-red-500/25 border border-red-500/50" : "bg-white/15 hover:bg-white/25"}`}>
        {active ? <OffIcon className="size-6 text-red-400" /> : <OnIcon className="size-6 text-white" />}
      </button>
      <span className="text-[10px] text-white/40">{label}</span>
    </div>
  );
  return (
    <div className="flex items-center justify-center gap-8 py-8 px-4">
      {btn(micOff, () => micOff ? microphone.enable() : microphone.disable(), MicIcon, MicOffIcon, micOff ? "Unmute" : "Mute")}
      <div className="flex flex-col items-center gap-2">
        <button onClick={onEnd} className="w-[68px] h-[68px] rounded-full bg-red-500 hover:bg-red-600 active:scale-90 flex items-center justify-center shadow-xl shadow-red-500/40">
          <PhoneOffIcon className="size-7 text-white" />
        </button>
        <span className="text-[10px] text-white/40">End</span>
      </div>
      {!isAudioOnly
        ? btn(camOff, () => camOff ? camera.enable() : camera.disable(), VideoIcon, VideoOffIcon, camOff ? "Camera" : "Camera")
        : <div className="flex flex-col items-center gap-2"><button className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center active:scale-90"><Volume2Icon className="size-6 text-white" /></button><span className="text-[10px] text-white/40">Speaker</span></div>
      }
    </div>
  );
};

/* — Video tile — */
const Tile = ({ participant, isLocal }) => {
  const vr = useRef(null);
  useEffect(() => { if (vr.current && participant?.videoStream) vr.current.srcObject = participant.videoStream; }, [participant?.videoStream]);
  const name = participant?.name || (isLocal ? "You" : "...");
  const hasV = !!participant?.videoStream;
  return (
    <div className="relative w-full h-full bg-[#1a2630] rounded-xl overflow-hidden flex items-center justify-center">
      {hasV ? <video ref={vr} autoPlay playsInline muted={isLocal} className="w-full h-full object-cover" />
        : <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00a884] to-[#025144] flex items-center justify-center text-3xl font-bold text-white">{name.charAt(0).toUpperCase()}</div>
            <p className="text-white/50 text-sm">{name}</p>
          </div>}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[11px]">{isLocal ? "You" : name}</div>
    </div>
  );
};

/* — Call content — */
const CallContent = ({ isAudioOnly, callerName, onCallEnd }) => {
  const { useCallCallingState, useParticipants, useLocalParticipant } = useCallStateHooks();
  const state = useCallCallingState();
  const participants = useParticipants();
  const local = useLocalParticipant();
  const navigate = useNavigate();
  const remotes = participants.filter(p => !p.isLocalParticipant);
  const joined = state === CallingState.JOINED;
  const connecting = state === CallingState.JOINING || state === CallingState.RINGING;
  const startTime = useRef(null);

  useEffect(() => { if (joined && !startTime.current) startTime.current = Date.now(); }, [joined]);
  useEffect(() => { if (state === CallingState.LEFT) navigate("/"); }, [state, navigate]);
  if (state === CallingState.LEFT) return null;

  const endCall = async () => {
    const dur = startTime.current ? Math.round((Date.now() - startTime.current) / 1000) : 0;
    try { await window.__callRef?.leave(); } catch { /* silent */ }
    onCallEnd(dur);
  };

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: "#0d1117" }}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pb-3 bg-gradient-to-b from-black/70 to-transparent" style={{ paddingTop: "max(16px,env(safe-area-inset-top))" }}>
        <p className="text-white font-semibold text-base">{callerName}</p>
        <Timer on={joined} />
      </div>

      {/* Media area */}
      <div className="flex-1 relative overflow-hidden">
        {isAudioOnly ? (
          /* Voice UI */
          <div className="w-full h-full flex flex-col items-center justify-center gap-6" style={{ background: "linear-gradient(160deg,#1a2630,#0d1117)" }}>
            <div className="relative flex items-center justify-center">
              <div className="absolute w-44 h-44 rounded-full border border-[#00a884]/20 animate-ping" style={{ animationDuration: "2s" }} />
              <div className="absolute w-56 h-56 rounded-full border border-[#00a884]/10 animate-ping" style={{ animationDuration: "2.6s", animationDelay: "0.3s" }} />
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#00a884] to-[#025144] flex items-center justify-center text-5xl font-bold text-white shadow-2xl ring-4 ring-[#00a884]/20">
                {callerName?.charAt(0)?.toUpperCase() || "?"}
              </div>
            </div>
            <div className="text-center">
              <p className="text-white text-2xl font-semibold">{callerName}</p>
              <div className="mt-2"><Timer on={joined} /></div>
            </div>
          </div>
        ) : (
          /* Video UI */
          <div className="w-full h-full">
            {remotes.length > 0
              ? <Tile participant={remotes[0]} isLocal={false} />
              : <div className="w-full h-full flex flex-col items-center justify-center gap-4" style={{ background: "linear-gradient(160deg,#1a2630,#0d1117)" }}>
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#00a884] to-[#025144] flex items-center justify-center text-4xl font-bold text-white">{callerName?.charAt(0)?.toUpperCase()}</div>
                  <p className="text-white text-xl">{callerName}</p>
                  <p className="text-white/40 text-sm">{connecting ? "Calling..." : "Waiting..."}</p>
                </div>
            }
            {/* PiP */}
            {local && <div className="absolute top-16 right-4 w-24 h-36 sm:w-32 sm:h-48 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-10"><Tile participant={local} isLocal /></div>}
            {/* Flip btn */}
            <button className="absolute bottom-36 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center z-10 border border-white/20 active:scale-90"><CameraIcon className="size-5 text-white" /></button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0" style={{ background: "linear-gradient(to top, #0d1117, transparent)", paddingBottom: "env(safe-area-inset-bottom,16px)" }}>
        <Controls isAudioOnly={isAudioOnly} onEnd={endCall} />
      </div>
    </div>
  );
};

/* ═══════════ CallPage ═══════════ */
const CallPage = () => {
  const { id: callId } = useParams();
  const [sp] = useSearchParams();
  const isAudioOnly = sp.get("audio") === "true";
  const [vc, setVc] = useState(null);
  const [call, setCall] = useState(null);
  const [busy, setBusy] = useState(true);
  const [callerName, setCallerName] = useState("");
  const [chatChannel, setChatChannel] = useState(null);
  const clientRef = useRef(null);
  const navigate = useNavigate();
  const { authUser, isLoading: al } = useAuthUser();
  const { data: td } = useQuery({ queryKey: ["streamToken"], queryFn: getStreamToken, enabled: !!authUser });

  useEffect(() => {
    if (!td?.token || !authUser || !callId) return;
    (async () => {
      try {
        // Video client
        const vc2 = new StreamVideoClient({ apiKey: STREAM_API_KEY, user: { id: authUser._id, name: authUser.fullName, image: authUser.profilePic }, token: td.token });
        clientRef.current = vc2;
        const ci = vc2.call("default", callId);
        if (isAudioOnly) await ci.camera.disable();
        await ci.join({ create: true });
        window.__callRef = ci;
        const members = ci.state?.members || {};
        const other = Object.values(members).find(m => m.user_id !== authUser._id);
        if (other?.user) setCallerName(other.user.name || "");
        setVc(vc2); setCall(ci);

        // Chat client for call log message
        const cc = StreamChat.getInstance(STREAM_API_KEY);
        if (cc.userID !== authUser._id) await cc.connectUser({ id: authUser._id, name: authUser.fullName, image: authUser.profilePic }, td.token);
        const targetId = callId.split("-").find(id => id !== authUser._id);
        if (targetId) {
          const ch = cc.channel("messaging", callId, { members: [authUser._id, targetId] });
          await ch.watch();
          setChatChannel(ch);
        }
      } catch (e) { console.error(e); toast.error("Could not join."); }
      finally { setBusy(false); }
    })();
    return () => { window.__callRef = null; clientRef.current?.disconnectUser().catch(() => {}); };
  }, [td, authUser, callId, isAudioOnly]);

  // Called when user ends the call — send call log message
  const handleCallEnd = async (duration) => {
    try {
      if (chatChannel) {
        await chatChannel.sendMessage({
          text: isAudioOnly ? "Voice call" : "Video call",
          call_log: true,
          call_type: isAudioOnly ? "voice" : "video",
          call_duration: duration,
        });
      }
    } catch { /* silent */ }
    navigate(-1);
  };

  if (al || busy) return <PageLoader />;

  if (!vc || !call) return (
    <div className="flex flex-col items-center justify-center gap-4 text-white" style={{ height: "100dvh", background: "#0d1117" }}>
      <PhoneOffIcon className="size-12 text-red-400" />
      <p className="text-lg font-medium">Could not connect</p>
      <button className="px-6 py-2.5 bg-[#00a884] rounded-full text-white font-medium active:scale-95" onClick={() => window.location.reload()}>Try Again</button>
      <button className="text-white/40 text-sm underline mt-1" onClick={() => navigate(-1)}>Go back</button>
    </div>
  );

  return (
    <StreamVideo client={vc}>
      <StreamCall call={call}>
        <StreamTheme>
          <CallContent isAudioOnly={isAudioOnly} callerName={callerName || authUser?.fullName} onCallEnd={handleCallEnd} />
        </StreamTheme>
      </StreamCall>
    </StreamVideo>
  );
};

export default CallPage;