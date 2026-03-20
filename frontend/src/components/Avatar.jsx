import { useState } from "react";

const getFallbackAvatarUrl = (name) => {
  const seed = name && typeof name === "string" ? name.trim() : "user";
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
};

const Avatar = ({ src, alt = "Avatar", size = "md", className = "" }) => {
  const [hasError, setHasError] = useState(false);
  const fallbackUrl = getFallbackAvatarUrl(alt);

  const sizeClasses = {
    xs: "size-8",
    sm: "size-10",
    md: "size-12",
    lg: "size-16",
    xl: "size-24",
    "2xl": "size-32",
  };

  const displaySrc = src && !hasError ? src : fallbackUrl;

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center bg-primary/10 shrink-0 ${className}`}
      title={alt}
    >
      <img
        src={displaySrc}
        alt={alt}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default Avatar;
