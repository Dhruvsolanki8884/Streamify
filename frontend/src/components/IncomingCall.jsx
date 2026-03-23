/**
 * IncomingCall.jsx
 * Global listener that shows a WhatsApp-style incoming call popup
 * when another user rings this user via Stream Video SDK.
 *
 * Mount this ONCE inside App.jsx (only when authenticated).
 * It creates its own StreamVideoClient to listen for ring events.
 */

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
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

  const [incomingCall, setIncomingCall] = useState(null); // { call, callerName, callerImage, isVideo }
  const [ringing, setRinging] = useState(false);
  const clientRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!tokenData?.token || !authUser) return;

    let cancelled = false;

    (async () => {
      try {
        // Reuse existing client if already connected
        const existing = window.__incomingCallClient;
        if (existing && existing.userID === authUser._id) {
          clientRef.current = existing;
          return;
        }

        const vc = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          token: tokenData.token,
        });

        window.__incomingCallClient = vc;
        clientRef.current = vc;

        // Listen for incoming ring calls
        vc.on("call.ring", (event) => {
          if (cancelled) return;
          const call = event.call;
          if (!call) return;

          // Don't show incoming call if we are the caller
          const createdBy = call.state?.createdBy?.id || call.created_by?.id;
          if (createdBy === authUser._id) return;

          const members = call.state?.members || {};
          const caller = Object.values(members).find(m => m.user_id !== authUser._id);
          const callerName = caller?.user?.name || "Unknown";
          const callerImage = caller?.user?.image || "";
          const isVideo = call.type !== "audio";

          setIncomingCall({ call, callerName, callerImage, isVideo });
          setRinging(true);
        });

      } catch (e) {
        console.error("IncomingCall listener error:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tokenData, authUser]);

  // Auto-dismiss if caller cancels
  useEffect(() => {
    if (!incomingCall?.call) return;
    const call = incomingCall.call;

    const handleLeft = () => {
      setIncomingCall(null);
      setRinging(false);
    };

    call.on("call.ended", handleLeft);
    call.on("call.rejected", handleLeft);

    return () => {
      call.off("call.ended", handleLeft);
      call.off("call.rejected", handleLeft);
    };
  }, [incomingCall]);

  const handleAccept = async () => {
    if (!incomingCall?.call) return;
    const { call, isVideo } = incomingCall;
    setRinging(false);
    setIncomingCall(null);
    // Navigate to call page — CallPage will join the existing ring call
    navigate(`/call/${call.id}${!isVideo ? "?audio=true" : ""}`);
  };

  const handleReject = async () => {
    if (!incomingCall?.call) return;
    try {
      await incomingCall.call.leave({ reject: true });
    } catch { /* silent */ }
    setIncomingCall(null);
    setRinging(false);
  };

  if (!ringing || !incomingCall) return null;

  const { callerName, callerImage, isVideo } = incomingCall;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full sm:w-[360px] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(160deg, #1a2630, #0d1117)" }}
      >
        {/* Pill handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>

        <div className="flex flex-col items-center px-8 pt-6 pb-10 gap-5">
          {/* Caller avatar with pulse rings */}
          <div className="relative flex items-center justify-center">
            <div className="absolute rounded-full animate-ping"
              style={{ width: 120, height: 120, background: "rgba(0,168,132,0.12)", animationDuration: "1.8s" }} />
            <div className="absolute rounded-full animate-ping"
              style={{ width: 148, height: 148, background: "rgba(0,168,132,0.07)", animationDuration: "2.4s", animationDelay: "0.3s" }} />
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-xl ring-4"
              style={{ ringColor: "rgba(0,168,132,0.4)" }}>
              {callerImage
                ? <img src={callerImage} alt={callerName} className="w-full h-full object-cover" />
                : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#00a884,#025144)" }}>
                    {callerName.charAt(0).toUpperCase()}
                  </div>
                )}
            </div>
          </div>

          {/* Caller info */}
          <div className="text-center">
            <p className="text-white text-xl font-semibold">{callerName}</p>
            <p className="text-sm mt-1 flex items-center justify-center gap-1.5"
              style={{ color: "rgba(255,255,255,0.5)" }}>
              {isVideo
                ? <><VideoIcon className="size-3.5" /> Incoming video call</>
                : <><PhoneIcon className="size-3.5" /> Incoming voice call</>}
            </p>
          </div>

          {/* Accept / Reject buttons */}
          <div className="flex items-center justify-center gap-16 mt-2">
            {/* Reject */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleReject}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg"
                style={{ background: "#ef4444", boxShadow: "0 0 20px rgba(239,68,68,0.4)" }}
              >
                <PhoneOffIcon className="size-7 text-white" />
              </button>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Decline</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleAccept}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg"
                style={{ background: "#00a884", boxShadow: "0 0 20px rgba(0,168,132,0.4)" }}
              >
                <PhoneIcon className="size-7 text-white" />
              </button>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Accept</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;
