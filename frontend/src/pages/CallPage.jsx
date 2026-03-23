/**
 * CallPage.jsx — WhatsApp-style voice & video call
 * Uses Stream Video SDK ring mode for real incoming call notifications.
 * Caller rings → receiver gets IncomingCall popup → accept navigates both to this page.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallingState,
  useCallStateHooks,
  useStreamVideoClient,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import PageLoader from "../components/pageLoader.jsx";
import {
  PhoneOffIcon, MicIcon, MicOffIcon,
  VideoIcon, VideoOffIcon, Volume2Icon, PhoneIcon,
} from "lucide-react";
import Avatar from "../components/Avatar.jsx";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

/* ─────────────────────────────────────────
   CALL TIMER
───────────────────────────────────────── */
const Timer = ({ active }) => {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!active) { setS(0); return; }
    const id = setInterval(() => setS(x => x + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return (
    <span className="text-sm animate-pulse" style={{ color: "rgba(255,255,255,0.5)" }}>
      Ringing...
    </span>
  );
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return <span className="text-sm font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>{mm}:{ss}</span>;
};

/* ─────────────────────────────────────────
   CONTROL BUTTON
───────────────────────────────────────── */
const CtrlBtn = ({ active, onClick, Icon, ActiveIcon, label }) => (
  <div className="flex flex-col items-center gap-2">
    <button
      onClick={onClick}
      className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md"
      style={{ background: active ? "rgba(239,68,68,0.22)" : "rgba(255,255,255,0.15)", border: active ? "1px solid rgba(239,68,68,0.5)" : "none" }}
    >
      {active
        ? <ActiveIcon className="size-6" style={{ color: "#f87171" }} />
        : <Icon className="size-6 text-white" />}
    </button>
    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
  </div>
);

/* ─────────────────────────────────────────
   CONTROLS BAR
───────────────────────────────────────── */
const Controls = ({ isAudioOnly, onEnd }) => {
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { microphone, isMute: micOff } = useMicrophoneState();
  const { camera, isMute: camOff } = useCameraState();

  return (
    <div className="flex items-center justify-center gap-8 py-8 px-6">
      <CtrlBtn
        active={micOff}
        onClick={() => micOff ? microphone.enable() : microphone.disable()}
        Icon={MicIcon} ActiveIcon={MicOffIcon}
        label={micOff ? "Unmute" : "Mute"}
      />
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onEnd}
          className="w-[70px] h-[70px] rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "#ef4444", boxShadow: "0 0 28px rgba(239,68,68,0.5)" }}
        >
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
          <button className="w-14 h-14 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <Volume2Icon className="size-6 text-white" />
          </button>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Speaker</span>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────
   VIDEO TILE
───────────────────────────────────────── */
const VideoTile = ({ participant, isLocal }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && participant?.videoStream) {
      ref.current.srcObject = participant.videoStream;
    }
  }, [participant?.videoStream]);

  const name = participant?.name || (isLocal ? "You" : "...");
  const hasVideo = !!participant?.videoStream;

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center"
      style={{ background: "#1a2630" }}>
      {hasVideo
        ? <video ref={ref} autoPlay playsInline muted={isLocal} className="w-full h-full object-cover" />
        : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
              style={{ background: "linear-gradient(135deg,#00a884,#025144)" }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{name}</p>
          </div>
        )}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-white text-[11px]"
        style={{ background: "rgba(0,0,0,0.5)" }}>
        {isLocal ? "You" : name}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   CALL CONTENT (inside StreamCall context)
───────────────────────────────────────── */
const CallContent = ({ isAudioOnly, callerName, callerImage, onCallEnd }) => {
  const { useCallCallingState, useParticipants, useLocalParticipant } = useCallStateHooks();
  const state = useCallCallingState();
  const participants = useParticipants();
  const local = useLocalParticipant();
  const navigate = useNavigate();
  const remotes = participants.filter(p => !p.isLocalParticipant);
  const joined = state === CallingState.JOINED;
  const startTime = useRef(null);

  useEffect(() => {
    if (joined && !startTime.current) startTime.current = Date.now();
  }, [joined]);

  useEffect(() => {
    if (state === CallingState.LEFT) navigate(-1);
  }, [state, navigate]);

  if (state === CallingState.LEFT) return null;

  const endCall = async () => {
    const dur = startTime.current ? Math.round((Date.now() - startTime.current) / 1000) : 0;
    try { await window.__streamCall?.leave(); } catch { /* silent */ }
    onCallEnd(dur);
  };

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: "#0d1117" }}>
      {/* Top overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 px-5 pb-4"
        style={{ paddingTop: "max(20px, env(safe-area-inset-top, 20px))", background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}>
        <p className="text-white font-semibold text-base leading-tight">{callerName}</p>
        <Timer active={joined} />
      </div>

      {/* Media area */}
      <div className="flex-1 relative overflow-hidden">
        {isAudioOnly ? (
          /* ── Voice call UI ── */
          <div className="w-full h-full flex flex-col items-center justify-center gap-6"
            style={{ background: "linear-gradient(160deg, #1a2630, #0d1117)" }}>
            <div className="relative flex items-center justify-center">
              <div className="absolute rounded-full border animate-ping"
                style={{ width: 176, height: 176, borderColor: "rgba(0,168,132,0.2)", animationDuration: "2s" }} />
              <div className="absolute rounded-full border animate-ping"
                style={{ width: 224, height: 224, borderColor: "rgba(0,168,132,0.1)", animationDuration: "2.6s", animationDelay: "0.3s" }} />
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 shadow-2xl"
                style={{ ringColor: "rgba(0,168,132,0.3)" }}>
                {callerImage
                  ? <img src={callerImage} alt={callerName} className="w-full h-full object-cover" />
                  : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#00a884,#025144)" }}>
                      {callerName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-white text-2xl font-semibold">{callerName}</p>
              <div className="mt-2"><Timer active={joined} /></div>
            </div>
          </div>
        ) : (
          /* ── Video call UI ── */
          <div className="w-full h-full">
            {remotes.length > 0
              ? <VideoTile participant={remotes[0]} isLocal={false} />
              : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4"
                  style={{ background: "linear-gradient(160deg, #1a2630, #0d1117)" }}>
                  <div className="w-28 h-28 rounded-full overflow-hidden shadow-2xl">
                    {callerImage
                      ? <img src={callerImage} alt={callerName} className="w-full h-full object-cover" />
                      : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
                          style={{ background: "linear-gradient(135deg,#00a884,#025144)" }}>
                          {callerName?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                  </div>
                  <p className="text-white text-xl font-medium">{callerName}</p>
                  <p className="text-sm animate-pulse" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {state === CallingState.JOINING ? "Connecting..." : "Waiting..."}
                  </p>
                </div>
              )}
            {/* PiP local video */}
            {local && (
              <div className="absolute top-16 right-3 w-24 h-36 sm:w-28 sm:h-44 rounded-xl overflow-hidden shadow-2xl z-10"
                style={{ border: "2px solid rgba(255,255,255,0.2)" }}>
                <VideoTile participant={local} isLocal />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)", background: "linear-gradient(to top, #0d1117 60%, transparent)" }}>
        <Controls isAudioOnly={isAudioOnly} onEnd={endCall} />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   CALL PAGE
───────────────────────────────────────── */
const CallPage = () => {
  const { id: callId } = useParams();
  const [sp] = useSearchParams();
  const isAudioOnly = sp.get("audio") === "true";

  const [videoClient, setVideoClient] = useState(null);
  const [call, setCall] = useState(null);
  const [busy, setBusy] = useState(true);
  const [callerName, setCallerName] = useState("");
  const [callerImage, setCallerImage] = useState("");
  const [chatCh, setChatCh] = useState(null);

  const videoClientRef = useRef(null);
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
        /* ── 1. Create Stream Video client ── */
        const vc = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          token: tokenData.token,
        });
        videoClientRef.current = vc;

        /* ── 2. Get or create the call ── */
        const ci = vc.call("default", callId);
        window.__streamCall = ci;

        /* ── 3. Join (don't create — caller already created via ring) ── */
        if (isAudioOnly) await ci.camera.disable();
        await ci.join({ create: true });

        /* ── 4. Resolve other participant's name/image ── */
        const membersMap = ci.state?.members || {};
        const other = Object.values(membersMap).find(m => m.user_id !== authUser._id);
        if (other?.user) {
          setCallerName(other.user.name || "");
          setCallerImage(other.user.image || "");
        }

        /* ── 5. Chat channel for call-log message ── */
        const cc = StreamChat.getInstance(STREAM_API_KEY);
        if (cc.userID !== authUser._id) {
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
      videoClientRef.current?.disconnectUser().catch(() => {});
    };
  }, [tokenData, authUser, callId, isAudioOnly]);

  const handleCallEnd = useCallback(async (duration) => {
    try {
      if (chatCh) {
        await chatCh.sendMessage({
          text: isAudioOnly ? "Voice call" : "Video call",
          call_log: true,
          call_type: isAudioOnly ? "voice" : "video",
          call_duration: duration,
        });
      }
    } catch { /* silent */ }
    navigate(-1);
  }, [chatCh, isAudioOnly, navigate]);

  if (authLoading || busy) return <PageLoader />;

  if (!videoClient || !call) return (
    <div className="flex flex-col items-center justify-center gap-4 text-white"
      style={{ height: "100dvh", background: "#0d1117" }}>
      <PhoneOffIcon className="size-12" style={{ color: "#f87171" }} />
      <p className="text-lg font-medium">Could not connect</p>
      <button
        className="px-6 py-2.5 rounded-full text-white font-medium active:scale-95 mt-2"
        style={{ background: "#00a884" }}
        onClick={() => window.location.reload()}
      >
        Try Again
      </button>
      <button className="text-sm underline mt-1" style={{ color: "rgba(255,255,255,0.4)" }}
        onClick={() => navigate(-1)}>
        Go back
      </button>
    </div>
  );

  return (
    <StreamVideo client={videoClient}>
      <StreamCall call={call}>
        <CallContent
          isAudioOnly={isAudioOnly}
          callerName={callerName || authUser?.fullName || ""}
          callerImage={callerImage || authUser?.profilePic || ""}
          onCallEnd={handleCallEnd}
        />
      </StreamCall>
    </StreamVideo>
  );
};

export default CallPage;
