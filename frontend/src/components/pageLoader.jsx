import { LoaderIcon } from "lucide-react";
import { useThemeStore } from "../Store/useThemeStore";
import { useState, useEffect } from "react";

const PageLoader = () => {
  const { theme } = useThemeStore();
  const [showSlowMsg, setShowSlowMsg] = useState(false);

  // After 4s, show a message so users know the server is waking up
  useEffect(() => {
    const t = setTimeout(() => setShowSlowMsg(true), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" data-theme={theme}>
      <LoaderIcon className="animate-spin size-10 text-primary" />
      {showSlowMsg && (
        <div className="text-center space-y-1 animate-fade-in">
          <p className="text-sm font-medium opacity-70">Waking up the server...</p>
          <p className="text-xs opacity-40">This takes up to 30s on first load</p>
        </div>
      )}
    </div>
  );
};

export default PageLoader;
