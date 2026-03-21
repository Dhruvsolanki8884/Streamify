import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, ShipWheelIcon } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import ChatBackgroundSelector from "./ChatBackgroundSelector";
import Avatar from "./Avatar";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-14 flex items-center">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full gap-2">
          {/* Left: logo — offset on mobile to clear the Sidebar toggle button */}
          <div className="flex items-center gap-2 min-w-0 pl-12 lg:pl-0">
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <ShipWheelIcon className="size-7 sm:size-8 text-primary shrink-0" />
              <span className="text-xl sm:text-2xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider truncate">
                Streamify
              </span>
            </Link>
          </div>

          {/* Right: action icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/notifications" className="btn btn-ghost btn-circle btn-sm sm:btn-md" aria-label="Notifications">
              <BellIcon className="size-5 text-base-content opacity-70" />
            </Link>
            {isChatPage && <ChatBackgroundSelector />}
            <ThemeSelector />
            <Link to="/profile" className="hover:opacity-90 transition-opacity" aria-label="Profile">
              <Avatar src={authUser?.profilePic} alt={authUser?.fullName} size="sm" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
