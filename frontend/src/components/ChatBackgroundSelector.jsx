import { useThemeStore, CHAT_BACKGROUND_OPTIONS } from "../Store/useThemeStore";
import { ImageIcon } from "lucide-react";

const ChatBackgroundSelector = () => {
  const { chatBackground, setChatBackground } = useThemeStore();

  return (
    <div className="dropdown dropdown-end">
      <button
        tabIndex={0}
        className="btn btn-ghost btn-circle"
        title="Chat Background"
      >
        <ImageIcon className="size-5" />
      </button>
      <div
        tabIndex={0}
        className="dropdown-content mt-2 p-2 shadow-xl bg-base-200 backdrop-blur-lg rounded-2xl w-48 border border-base-content/10 max-h-64 overflow-y-auto z-50"
      >
        <p className="text-xs font-semibold px-2 py-1 opacity-70">
          Chat Background
        </p>
        {CHAT_BACKGROUND_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 text-left text-sm transition-colors ${
              chatBackground === opt.id ? "bg-primary/20 text-primary" : "hover:bg-base-content/5"
            }`}
            onClick={() => setChatBackground(opt.id)}
          >
            <span
              className="size-6 rounded border border-base-content/20 shrink-0"
              style={{
                background: opt.value || "var(--fallback-b1, oklch(var(--b1)))",
              }}
            />
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatBackgroundSelector;
