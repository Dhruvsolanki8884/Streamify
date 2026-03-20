import { create } from "zustand";

const CHAT_BACKGROUNDS = [
  { id: "default", label: "Default", value: "" },
  { id: "gradient-sunset", label: "Sunset", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { id: "gradient-ocean", label: "Ocean", value: "linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)" },
  { id: "gradient-forest", label: "Forest", value: "linear-gradient(135deg, #059669 0%, #10b981 100%)" },
  { id: "gradient-warm", label: "Warm", value: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)" },
  { id: "gradient-midnight", label: "Midnight", value: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)" },
  { id: "gradient-lavender", label: "Lavender", value: "linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)" },
  { id: "solid-light", label: "Light Gray", value: "#f1f5f9" },
  { id: "solid-dark", label: "Dark Gray", value: "#1e293b" },
];

export const CHAT_BACKGROUND_OPTIONS = CHAT_BACKGROUNDS;

const getInitialChatBg = () => {
  const id = localStorage.getItem("streamify-chat-bg") || "default";
  const opt = CHAT_BACKGROUNDS.find((b) => b.id === id);
  return { id, value: opt?.value ?? "" };
};

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("streamify-theme") || "coffee",
  chatBackground: getInitialChatBg().id,
  chatBackgroundValue: getInitialChatBg().value,
  setTheme: (theme) => {
    localStorage.setItem("streamify-theme", theme);
    set({ theme });
  },
  setChatBackground: (id, value) => {
    const opt = CHAT_BACKGROUNDS.find((b) => b.id === id);
    const val = value ?? opt?.value ?? "";
    localStorage.setItem("streamify-chat-bg", id);
    localStorage.setItem("streamify-chat-bg-value", val);
    set({ chatBackground: id, chatBackgroundValue: val });
  },
}));
    