/**
 * IncomingCall.jsx
 *
 * HOW IT WORKS:
 * - Mounted globally in App.jsx for every authenticated user
 * - Connects to Stream Chat and watches ALL channels the user is a member of
 * - Listens for "call_initiated" custom events on those channels
 * - Shows full-screen incoming call UI with Accept / Decline
 * - Accept → navigate to /call/:id
 * - Decline → send "call_rejected" event back, dismiss UI
 * - Auto-dismiss after 45s (missed call)
 * - Listens for "call_cancelled" to dismiss if caller hangs up
 */

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
  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  const [incoming, setIncoming] = useState(null);
  const dismissTimer = useRef(null);
  const watchedChannels = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show incoming call UI if already on the call page
  const onCallPage = location.pathname.startsWith("/call/");

  useEffect(() => {
    if (!tokenData?.token || !authUser) return;

    let active = true;

    const setup = async () => {
      try {
        // Get (or reuse) the Stream Chat singleton
        const client = StreamChat.getInstance(STREAM_API_KEY);

        // Connect user if not already connected
        if (!client.userID) {
          await client.connectUser(
            { id: authUser._id, name: authUser.fullName, image: authUser.profilePic },
            tokenData.token
          );
        }

        // Query all messaging channels this user is a member of
        // and watch them so events arrive in real-time
        const filter = { type: "messaging", members: { $in: [authUser._id] } };
        const channels = await client.queryChannels(filter, {}, { watch: true, state: true });
        if (active) watchedChannels.current = channels;

        // ── Event: incoming call ──
        const onCallInitiated = (event) => {
          if (!active) return;
          if (event.type !== "call_initiated") return;
          if (event.callerId === authUser._id) return; // ignore own events

          const { callId, callerName, callerImage, isVideo, channelId } = event;

          setIncoming({ callId, callerName, callerImage: callerImage || "", isVideo, channelId });

          // Auto-dismiss after 45s → missed call for receiver
          clearTimeout(dismissTimer.current);
          dismissTimer.current = setTimeout(async () => {
            if (!active) return;
            // Send missed call log for receiver side
            try {
              const client2 = StreamChat.getInstance(STREAM_API_KEY);
              const ch2 = client2.channel("messaging", channelId);
              await ch2.watch();
              await ch2.sendMessage({
                text: "Missed call",
                call_log: true,
                call_type: isVideo ? "video" : "voice",
                call_duration: 0,
                call_missed: true,
                call_direction: "incoming",
              });
            } catch { /* silent */ }
            setIncoming(null);
          }, 45000);
        };

        // ── Event: caller cancelled or call ended ──
        const onCallCancelled = (event) => {
          if (!active) return;
          if (event.type !== "call_cancelled" && event.type !== "call_ended") return;
          setIncoming(prev => {
            if (prev?.callId === event.callId) {
              clearTimeout(dismissTimer.current);
              return null;
            }
            return prev;
          });
        };

        // Listen on the global client — fires for ALL watched channels
        client.on(onCallInitiated);
        client.on(onCallCancelled);

        // Store cleanup refs
        watchedChannels.current._cleanup = () => {
          client.off(onCallInitiated);
          client.off(onCallCancelled);
        };
      } catch (e) {
        console.error("IncomingCall setup error:", e);
      }
    };

    setup();

    return () => {
      active = false;
      clearTimeout(dismissTimer.current);
      if (watchedChannels.current._cleanup) {
        watchedChannels.current._cleanup();
      }
    };
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
      // Tell caller the call was rejected
      await ch.sendEvent({ type: "call_rejected", callId: incoming.callId });
      // Receiver sends their own missed call log
      await ch.sendMessage({
        text: "Missed call",
        call_log: true,
        call_type: incoming.isVideo ? "video" : "voice",
        call_duration: 0,
        call_missed: true,
        call_direction: "incoming",
      });
    } catch { /* silent */ }

    setIncoming(null);
  }, [incoming]);

  // Don't render if on call page or no incoming call
  if (!incoming || onCallPage) return null;

  const { callerName, callerImage, isVideo } = incoming;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none"
      style={{ background: "linear-gradient(160deg, #0b1117 0%, #1a2630 60%, #0d1f1a 100%)" }}
    >
      {/* Call type label */}
      <p
        className="text-xs font-semibold tracking-[0.2em] uppercase mb-10"
        style={{ color: "rgba(0,168,132,0.7)" }}
      >
        {isVideo ? "Incoming Video Call" : "Incoming Voice Call"}
      </p>

      {/* Avatar + pulse rings */}
      <div className="relative flex items-center justify-center mb-8">
        <div
          className="absolute rounded-full animate-ping"
          style={{ width: 220, height: 220, background: "rgba(0,168,132,0.06)", animationDuration: "2.2s" }}
        />
        <div
          className="absolute rounded-full animate-ping"
          style={{ width: 175, height: 175, background: "rgba(0,168,132,0.1)", animationDuration: "2.2s", animationDelay: "0.55s" }}
        />
        <div
          className="absolute rounded-full"
          style={{ width: 148, height: 148, background: "rgba(0,168,132,0.07)" }}
        />
        <div
          className="w-32 h-32 rounded-full overflow-hidden relative z-10 shadow-2xl"
          style={{ border: "3px solid rgba(0,168,132,0.6)", boxShadow: "0 0 40px rgba(0,168,132,0.25)" }}
        >
          {callerImage ? (
            <img src={callerImage} alt={callerName} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-5xl font-bold text-white"
              style={{ background: "linear-gradient(135deg, #00a884, #025144)" }}
            >
              {callerName?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <h2 className="text-white text-3xl font-bold mb-2 tracking-tight">{callerName}</h2>
      <div className="flex items-center gap-2 mb-20" style={{ color: "rgba(255,255,255,0.45)" }}>
        {isVideo ? (
          <><VideoIcon className="size-4" /><span className="text-sm">Video</span></>
        ) : (
          <><PhoneIcon className="size-4" /><span className="text-sm">Voice</span></>
        )}
      </div>

      {/* Decline / Accept */}
      <div className="flex items-center justify-center gap-24">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleReject}
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: "#ef4444", boxShadow: "0 0 30px rgba(239,68,68,0.55)" }}
          >
            <PhoneOffIcon className="size-8 text-white" />
          </button>
          <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Decline</span>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleAccept}
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: "#00a884", boxShadow: "0 0 30px rgba(0,168,132,0.55)" }}
          >
            <PhoneIcon className="size-8 text-white" />
          </button>
          <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Accept</span>
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;
