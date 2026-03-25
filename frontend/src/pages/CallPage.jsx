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
import {
  PhoneOffIcon, MicIcon, MicOffIcon,
  VideoIcon, VideoOffIcon, Volume2Icon, VolumeXIcon,
} from "lucide-react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const pad = n => String(n).padStart(2, "0");
const fmtDur = secs => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

/* ══════════════════════════════════════
   TIMER — ticks only when active=true
   Resets to 0 when deactivated
══════════════════════════════════════ */
const Timer = ({ active, label }) => {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!active) { setSecs(0); return; }
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) {
    return (
      <span className="text-sm animate-pulse" style={{ color: "rgba(255,255,255,0.5)" }}>
        {label}
      </span>
    );
  }
  return (
    <span className="text-sm font-mono tracking-wide" style={{ color: "rgba(255,255,255,0.8)" }}>
      {fmtDur(secs)}
    </span>
  );
};

/* ══════════════════════════════════════
   CONTROL BUTTON — active = highlighted red
══════════════════════════════════════ */
const CtrlBtn = ({ active, onClick, Icon, ActiveIcon, label }) => (
  <div className="flex flex-col items-center gap-2">
    <button
      onClick={onClick}
      className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shadow-md"
      style={{
        background: active ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.15)",
        border: active ? "1.5px solid rgba(239,68,68,0.6)" : "1.5px solid rgba(255,255,255,0.1)",
      }}
    >
      {active
        ? <ActiveIcon className="size-6" style={{ color: "#f87171" }} />
        : <Icon className="size-6 text-white" />}
    </button>
    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
  </div>
);

/* ══════════════════════════════════════
   SPEAKER BUTTON — toggles audio output
   Active = speaker ON (highlighted green)
══════════════════════════════════════ */
const SpeakerBtn = () => {
  const [speakerOn, setSpeakerOn] = useState(true);

  const toggle = useCallback(async () => {
    const next = !speakerOn;
    setSpeakerOn(next);
    // On mobile browsers, we can't programmatically switch audio output
    // but we can mute/unmute all remote audio elements as a workaround
    document.querySelectorAll("audio").forEach(el => { el.muted = !next; });
    document.querySelectorAll("video:not([muted])").forEach(el => { el.muted = !next; });
  }, [speakerOn]);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={toggle}
        className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shadow-md"
        style={{
          background: speakerOn ? "rgba(0,168,132,0.25)" : "rgba(255,255,255,0.15)",
          border: speakerOn ? "1.5px solid rgba(0,168,132,0.6)" : "1.5px solid rgba(255,255,255,0.1)",
        }}
      >
        {speakerOn
          ? <Volume2Icon className="size-6" style={{ color: "#00a884" }} />
          : <VolumeXIcon className="size-6 text-white" />}
      </button>
      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
        {speakerOn ? "Speaker" : "Muted"}
      </span>
    </div>
  );
};

/* ══════════════════════════════════════
   CONTROLS BAR
══════════════════════════════════════ */
const Controls = ({ isAudioOnly, onEnd }) => {
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { microphone, isMute: micOff } = useMicrophoneState();
  const { camera, isMute: camOff } = useCameraState();

  return (
    <div className="flex items-center justify-center gap-7 py-8 px-6">
      {/* Mute */}
      <CtrlBtn
        active={micOff}
        onClick={() => micOff ? microphone.enable() : microphone.disable()}
        Icon={MicIcon}
        ActiveIcon={MicOffIcon}
        label={micOff ? "Unmute" : "Mute"}
      />

      {/* End call */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onEnd}
          className="w-[70px] h-[70px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
          style={{ background: "#ef4444", boxShadow: "0 0 28px rgba(239,68,68,0.55)" }}
        >
          <PhoneOffIcon className="size-7 text-white" />
        </button>
        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>End</span>
      </div>

      {/* Camera (video) or Speaker (audio) */}
      {!isAudioOnly ? (
        <CtrlBtn
          active={camOff}
          onClick={() => camOff ? camera.enable() : camera.disable()}
          Icon={VideoIcon}
          ActiveIcon={VideoOffIcon}
          label={camOff ? "Cam off" : "Camera"}
        />
      ) : (
        <SpeakerBtn />
      )}
    </div>
  );
};

/* ══════════════════════════════════════
   CALL CONTENT  (inside StreamCall context)
══════════════════════════════════════ */
const CallContent = ({ isAudioOnly, peerName, peerImage, onCallEnd, onMissed }) => {
  const { useCallCallingState, useParticipants, useLocalParticipant } = useCallStateHooks();
  const state = useCallCallingState();
  const participants = useParticipants();
  const local = useLocalParticipant();
  const navigate = useNavigate();

  const remotes = participants.filter(p => !p.isLocalParticipant);

  // Timer starts ONLY when both users are in the call
  const iJoined = state === CallingState.JOINED;
  const bothConnected = iJoined && remotes.length > 0;

  const startTimeRef = useRef(null);
  const missedTimerRef = useRef(null);
  const missedFiredRef = useRef(false);

  // Record exact moment both connected
  useEffect(() => {
    if (bothConnected && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      clearTimeout(missedTimerRef.current);
    }
  }, [bothConnected]);

  // 30s no-answer → missed call
  useEffect(() => {
    if (!iJoined || bothConnected) return;
    missedTimerRef.current = setTimeout(() => {
      if (!startTimeRef.current && !missedFiredRef.current) {
        missedFiredRef.current = true;
        onMissed();
      }
    }, 30000);
    return () => clearTimeout(missedTimerRef.current);
  }, [iJoined, bothConnected, onMissed]);

  // Navigate back when call ends
  useEffect(() => {
    if (state === CallingState.LEFT) navigate(-1);
  }, [state, navigate]);

  if (state === CallingState.LEFT) return null;

  // Status label — shown instead of timer when not yet connected
  const statusLabel = (() => {
    if (bothConnected) return null; // timer shows
    if (state === CallingState.JOINING) return "Connecting...";
    if (iJoined && remotes.length === 0) return "Ringing...";
    return "Calling...";
  })();

  const endCall = async () => {
    const dur = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : 0;
    clearTimeout(missedTimerRef.current);
    try { await window.__streamCall?.leave(); } catch { /* silent */ }
    onCallEnd(dur);
  };

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: "#0d1117" }}>

      {/* ── Top: name + timer/status ── */}
      <div
        className="absolute top-0 left-0 right-0 z-20 px-5 pb-4"
        style={{
          paddingTop: "max(20px, env(safe-area-inset-top, 20px))",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)",
        }}
      >
        <p className="text-white font-semibold text-base leading-tight">{peerName}</p>
        <Timer active={bothConnected} label={statusLabel || "Calling..."} />
      </div>

      {/* ── Media area ── */}
      <div className="flex-1 relative overflow-hidden">
        {isAudioOnly ? (
          /* Voice call UI */
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-6"
            style={{ background: "linear-gradient(160deg, #1a2630, #0d1117)" }}
          >
            {/* Hidden audio — ParticipantView binds the audio stream */}
            {remotes.map(p => (
              <div key={p.sessionId} className="sr-only" aria-hidden>
                <ParticipantView participant={p} trackType="audioTrack" />
              </div>
            ))}

            {/* Pulse rings + avatar */}
            <div className="relative flex items-center justify-center">
              <div className="absolute rounded-full animate-ping"
                style={{ width: 210, height: 210, background: "rgba(0,168,132,0.07)", animationDuration: "2.2s" }} />
              <div className="absolute rounded-full animate-ping"
                style={{ width: 168, height: 168, background: "rgba(0,168,132,0.11)", animationDuration: "2.2s", animationDelay: "0.55s" }} />
              <div
                className="w-32 h-32 rounded-full overflow-hidden shadow-2xl relative z-10"
                style={{ border: "3px solid rgba(0,168,132,0.5)", boxShadow: "0 0 40px rgba(0,168,132,0.2)" }}
              >
                {peerImage
                  ? <img src={peerImage} alt={peerName} className="w-full h-full object-cover" />
                  : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#00a884,#025144)" }}>
                      {peerName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
              </div>
            </div>

            <div className="text-center">
              <p className="text-white text-2xl font-semibold">{peerName}</p>
              <div className="mt-2">
                <Timer active={bothConnected} label={statusLabel || "Calling..."} />
              </div>
            </div>
          </div>
        ) : (
          /* Video call UI */
          <div className="w-full h-full">
            {remotes.length > 0 ? (
              /* Remote full-screen */
              <div className="w-full h-full">
                <ParticipantView
                  participant={remotes[0]}
                  className="w-full h-full object-cover"
                  trackType="videoTrack"
                />
              </div>
            ) : (
              /* Waiting for remote */
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-4"
                style={{ background: "linear-gradient(160deg, #1a2630, #0d1117)" }}
              >
                <div className="w-28 h-28 rounded-full overflow-hidden shadow-2xl"
                  style={{ border: "3px solid rgba(0,168,132,0.4)" }}>
                  {peerImage
                    ? <img src={peerImage} alt={peerName} className="w-full h-full object-cover" />
                    : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
                        style={{ background: "linear-gradient(135deg,#00a884,#025144)" }}>
                        {peerName?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                </div>
                <p className="text-white text-xl font-medium">{peerName}</p>
                <p className="text-sm animate-pulse" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {statusLabel || "Calling..."}
                </p>
              </div>
            )}

            {/* Local PiP */}
            {local && (
              <div
                className="absolute top-16 right-3 w-24 h-36 sm:w-28 sm:h-44 rounded-xl overflow-hidden shadow-2xl z-10"
                style={{ border: "2px solid rgba(255,255,255,0.2)" }}
              >
                <ParticipantView
                  participant={local}
                  className="w-full h-full object-cover"
                  trackType="videoTrack"
                  mirror
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div
        className="shrink-0"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
          background: "linear-gradient(to top, #0d1117 60%, transparent)",
        }}
      >
        <Controls isAudioOnly={isAudioOnly} onEnd={endCall} />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   CALL PAGE
══════════════════════════════════════ */
const CallPage = () => {
  const { id: callId } = useParams();
  const [sp] = useSearchParams();
  const isAudioOnly = sp.get("audio") === "true";

  const [videoClient, setVideoClient] = useState(null);
  const [call, setCall] = useState(null);
  const [busy, setBusy] = useState(true);
  const [peerName, setPeerName] = useState("");
  const [peerImage, setPeerImage] = useState("");
  const [chatCh, setChatCh] = useState(null);
  const isCallerRef = useRef(false);
  const clientRef = useRef(null);
  const navigate = useNavigate();
  const { authUser, isLoading: authLoading } = useAuthUser();
  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    if (!tokenData?.token || !authUser || !callId) return;
    let cancelled = false;

    (async () => {
      try {
        // Disconnect any stale video client before creating a new one
        if (window.__streamVideoClient) {
          try { await window.__streamVideoClient.disconnectUser(); } catch { /* silent */ }
          window.__streamVideoClient = null;
        }

        const vc = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: { id: authUser._id, name: authUser.fullName, image: authUser.profilePic },
          token: tokenData.token,
        });
        window.__streamVideoClient = vc;
        clientRef.current = vc;

        const ci = vc.call("default", callId);
        window.__streamCall = ci;

        // Request permissions BEFORE joining — triggers browser prompt once
        try {
          const stream = await navigator.mediaDevices.getUserMedia(
            isAudioOnly ? { audio: true } : { audio: true, video: true }
          );
          stream.getTracks().forEach(t => t.stop());
        } catch (permErr) {
          toast.error(
            permErr.name === "NotAllowedError"
              ? "Microphone permission denied. Allow mic access in browser settings."
              : "Could not access microphone.",
            { duration: 5000 }
          );
          if (!cancelled) setBusy(false);
          return;
        }

        if (isAudioOnly) await ci.camera.disable();
        await ci.join({ create: true });

        // Resolve peer info
        const membersMap = ci.state?.members || {};
        const other = Object.values(membersMap).find(m => m.user_id !== authUser._id);
        if (other?.user) {
          setPeerName(other.user.name || "");
          setPeerImage(other.user.image || "");
        }

        // Am I the caller?
        const createdById = ci.state?.createdBy?.id;
        isCallerRef.current = !createdById || createdById === authUser._id;

        // Chat channel for call log + sync events
        const cc = StreamChat.getInstance(STREAM_API_KEY);
        if (!cc.userID) {
          await cc.connectUser(
            { id: authUser._id, name: authUser.fullName, image: authUser.profilePic },
            tokenData.token
          );
        }
        const targetId = callId.split("-").find(id => id !== authUser._id);
        if (targetId) {
          const ch = cc.channel("messaging", callId, { members: [authUser._id, targetId] });
          await ch.watch();
          if (!cancelled) setChatCh(ch);

          ch.on((event) => {
            // Receiver rejected → caller gets missed call + navigates back
            if (event.type === "call_rejected" && event.callId === callId) {
              ch.sendMessage({
                text: "Missed call",
                call_log: true,
                call_type: isAudioOnly ? "voice" : "video",
                call_duration: 0,
                call_missed: true,
                call_direction: "outgoing",
              }).catch(() => {});
              navigate(-1);
            }
            // Other user ended → navigate back instantly
            if (event.type === "call_ended" && event.callId === callId) {
              navigate(-1);
            }
          });
        }

        if (!cancelled) { setVideoClient(vc); setCall(ci); }
      } catch (e) {
        console.error("Call join error:", e);
        toast.error("Could not connect to call.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
      window.__streamCall = null;
      window.__streamVideoClient = null;
      clientRef.current?.disconnectUser().catch(() => {});
    };
  }, [tokenData, authUser, callId, isAudioOnly, navigate]);

  const handleMissed = useCallback(async () => {
    try { await window.__streamCall?.leave(); } catch { /* silent */ }
    try {
      if (chatCh) {
        await chatCh.sendMessage({
          text: "Missed call",
          call_log: true,
          call_type: isAudioOnly ? "voice" : "video",
          call_duration: 0,
          call_missed: true,
          call_direction: isCallerRef.current ? "outgoing" : "incoming",
        });
        await chatCh.sendEvent({ type: "call_ended", callId });
      }
    } catch { /* silent */ }
    navigate(-1);
  }, [chatCh, isAudioOnly, callId, navigate]);

  const handleCallEnd = useCallback(async (duration) => {
    try {
      if (chatCh) {
        await chatCh.sendMessage({
          text: isAudioOnly ? "Voice call" : "Video call",
          call_log: true,
          call_type: isAudioOnly ? "voice" : "video",
          call_duration: duration,
          call_duration_str: duration > 0 ? fmtDur(duration) : "",
          call_missed: false,
          call_direction: isCallerRef.current ? "outgoing" : "incoming",
        });
        await chatCh.sendEvent({ type: "call_ended", callId });
      }
    } catch { /* silent */ }
    navigate(-1);
  }, [chatCh, isAudioOnly, callId, navigate]);

  if (authLoading || busy) return <PageLoader />;

  if (!videoClient || !call) return (
    <div
      className="flex flex-col items-center justify-center gap-4 text-white"
      style={{ height: "100dvh", background: "#0d1117" }}
    >
      <PhoneOffIcon className="size-12" style={{ color: "#f87171" }} />
      <p className="text-lg font-medium">Could not connect</p>
      <button
        className="px-6 py-2.5 rounded-full text-white font-medium active:scale-95 mt-2"
        style={{ background: "#00a884" }}
        onClick={() => window.location.reload()}
      >
        Try Again
      </button>
      <button
        className="text-sm underline mt-1"
        style={{ color: "rgba(255,255,255,0.4)" }}
        onClick={() => navigate(-1)}
      >
        Go back
      </button>
    </div>
  );

  return (
    <StreamVideo client={videoClient}>
      <StreamCall call={call}>
        <CallContent
          isAudioOnly={isAudioOnly}
          peerName={peerName || authUser?.fullName || ""}
          peerImage={peerImage || authUser?.profilePic || ""}
          onCallEnd={handleCallEnd}
          onMissed={handleMissed}
        />
      </StreamCall>
    </StreamVideo>
  );
};

export default CallPage;
