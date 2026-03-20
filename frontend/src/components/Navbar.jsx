import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import {
  BellIcon,
  ShipWheelIcon,
  MenuIcon,
  HomeIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import ChatBackgroundSelector from "./ChatBackgroundSelector";
import Avatar from "./Avatar";

const navLinks = [
  { to: "/", icon: HomeIcon, label: "Home" },
  { to: "/friends", icon: UsersIcon, label: "Friends" },
  { to: "/notifications", icon: BellIcon, label: "Notifications" },
];

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef(null);
  const isChatPage = location.pathname?.startsWith("/chat");

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    const fn = (e) => {
      if (
        open &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        !e.target.closest("#menu-btn")
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    document.addEventListener("touchstart", fn);
    return () => {
      document.removeEventListener("mousedown", fn);
      document.removeEventListener("touchstart", fn);
    };
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* ── Navbar ── */}
      <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-14 sm:h-16 flex items-center">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between w-full gap-2">
            {/* Left: hamburger + logo */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                id="menu-btn"
                onClick={() => setOpen((v) => !v)}
                className="lg:hidden btn btn-ghost btn-square btn-sm transition-transform duration-200 active:scale-90"
                aria-label={open ? "Close menu" : "Open menu"}
              >
                <span
                  className={`transition-all duration-300 ${open ? "rotate-90 opacity-0 scale-75 absolute" : "rotate-0 opacity-100 scale-100"}`}
                >
                  <MenuIcon className="size-6" />
                </span>
                <span
                  className={`transition-all duration-300 ${open ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-75 absolute"}`}
                >
                  <XIcon className="size-6" />
                </span>
              </button>

              <Link
                to="/"
                className="flex items-center gap-1.5 sm:gap-2.5 min-w-0"
              >
                <ShipWheelIcon className="size-7 sm:size-9 text-primary shrink-0" />
                <span className="text-xl sm:text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider truncate">
                  Streamify
                </span>
              </Link>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1 sm:gap-3 lg:gap-4">
              <Link
                to="/notifications"
                className="btn btn-ghost btn-circle btn-sm sm:btn-md"
              >
                <BellIcon className="size-5 sm:size-6 text-base-content opacity-70" />
              </Link>
              {isChatPage && <ChatBackgroundSelector />}
              <ThemeSelector />
              <Link
                to="/profile"
                className="hover:opacity-90 transition-opacity"
              >
                <Avatar
                  src={authUser?.profilePic}
                  alt={authUser?.fullName}
                  size="sm"
                />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Backdrop ── */}
      <div
        onClick={() => setOpen(false)}
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* ── Sidebar ── */}
      <aside
        ref={sidebarRef}
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-72 flex flex-col bg-base-200 border-r border-base-300 shadow-2xl transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-base-300">
          <Link
            to="/"
            className="flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <ShipWheelIcon className="size-7 text-primary" />
            <span className="text-xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              Streamify
            </span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1">
          {navLinks.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active ? "bg-primary text-primary-content shadow-sm" : "hover:bg-base-300 text-base-content/70 hover:text-base-content"}`}
              >
                <Icon
                  className={`size-5 shrink-0 ${active ? "text-primary-content" : "opacity-60"}`}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User card at bottom */}
        <div className="p-3 border-t border-base-300">
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-base-300 transition-all duration-200 group"
          >
            <div className="relative shrink-0">
              <Avatar
                src={authUser?.profilePic}
                alt={authUser?.fullName}
                size="sm"
              />
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-success ring-2 ring-base-200" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {authUser?.fullName}
              </p>
              <p className="text-xs text-success flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-success inline-block" />
                Online
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
