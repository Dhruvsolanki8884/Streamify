// import { Link, useLocation } from "react-router";
// import useAuthUser from "../hooks/useAuthUser";
// import { BellIcon, HomeIcon, ShipWheelIcon, UsersIcon } from "lucide-react";
// import Avatar from "./Avatar";

// const Sidebar = () => {
//   const { authUser } = useAuthUser();
//   const location = useLocation();
//   const currentPath = location.pathname;

//   return (
//     <aside className="w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen sticky top-0">
//       <div className="p-5 border-b border-base-300">
//         <Link to="/" className="flex items-center gap-2.5">
//           <ShipWheelIcon className="size-9 text-primary" />
//           <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
//             Streamify
//           </span>
//         </Link>
//       </div>

//       <nav className="flex-1 p-4 space-y-1">
//         <Link
//           to="/"
//           className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
//             currentPath === "/" ? "btn-active" : ""
//           }`}
//         >
//           <HomeIcon className="size-5 text-base-content opacity-70" />
//           <span>Home</span>
//         </Link>

//         <Link
//           to="/friends"
//           className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
//             currentPath === "/friends" ? "btn-active" : ""
//           }`}
//         >
//           <UsersIcon className="size-5 text-base-content opacity-70" />
//           <span>Friends</span>
//         </Link>

//         <Link
//           to="/notifications"
//           className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
//             currentPath === "/notifications" ? "btn-active" : ""
//           }`}
//         >
//           <BellIcon className="size-5 text-base-content opacity-70" />
//           <span>Notifications</span>
//         </Link>
//       </nav>

//       {/* USER PROFILE SECTION */}
//       <div className="p-4 border-t border-base-300 mt-auto">
//         <Link
//           to="/profile"
//           className="flex items-center gap-3 hover:opacity-90 transition-opacity"
//         >
//           <Avatar
//             src={authUser?.profilePic}
//             alt={authUser?.fullName}
//             size="sm"
//           />
//           <div className="flex-1 min-w-0">
//             <p className="font-semibold text-sm truncate">
//               {authUser?.fullName}
//             </p>
//             <p className="text-xs text-success flex items-center gap-1">
//               <span className="size-2 rounded-full bg-success shrink-0 inline-block" />
//               Online
//             </p>
//           </div>
//         </Link>
//       </div>
//     </aside>
//   );
// };
// export default Sidebar;




import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import {
  BellIcon,
  HomeIcon,
  ShipWheelIcon,
  UsersIcon,
  MenuIcon,
  XIcon,
  LogOutIcon,
  SettingsIcon,
} from "lucide-react";
import Avatar from "./Avatar";
import { useState, useEffect, useRef } from "react";

const NAV_ITEMS = [
  { to: "/", icon: HomeIcon, label: "Home" },
  { to: "/friends", icon: UsersIcon, label: "Friends" },
  { to: "/notifications", icon: BellIcon, label: "Notifications" },
];

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;

  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef(null);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close sidebar when clicking outside (mobile)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        !e.target.closest("#sidebar-toggle")
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* ── Mobile Toggle Button ─────────────────────────── */}
      <button
        id="sidebar-toggle"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className="
          lg:hidden fixed top-4 left-4 z-50
          size-10 rounded-xl
          bg-base-100 border border-base-300
          shadow-md
          flex items-center justify-center
          transition-all duration-200
          hover:bg-base-200 active:scale-95
        "
      >
        <span
          className="transition-all duration-300"
          style={{ display: "grid", placeItems: "center" }}
        >
          {isOpen ? (
            <XIcon className="size-5 text-base-content" />
          ) : (
            <MenuIcon className="size-5 text-base-content" />
          )}
        </span>
      </button>

      {/* ── Backdrop (mobile only) ────────────────────────── */}
      <div
        onClick={() => setIsOpen(false)}
        className={`
          lg:hidden fixed inset-0 z-30
          bg-black/50 backdrop-blur-sm
          transition-opacity duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* ── Sidebar Panel ─────────────────────────────────── */}
      <aside
        ref={sidebarRef}
        className={`
          fixed lg:sticky top-0 left-0 z-40
          h-screen w-72
          flex flex-col
          bg-base-100
          border-r border-base-200
          shadow-xl lg:shadow-none
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* ── Logo ──────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-base-200 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="
              size-9 rounded-xl
              bg-gradient-to-br from-primary to-secondary
              flex items-center justify-center
              shadow-md
              group-hover:shadow-primary/30
              transition-shadow duration-300
            "
            >
              <ShipWheelIcon className="size-5 text-primary-content" />
            </div>
            <span
              className="
              text-2xl font-bold font-mono tracking-wider
              bg-clip-text text-transparent
              bg-gradient-to-r from-primary to-secondary
            "
            >
              Streamify
            </span>
          </Link>

          {/* Close button visible inside sidebar on mobile */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden btn btn-ghost btn-sm btn-circle"
            aria-label="Close menu"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* ── Navigation ────────────────────────────────── */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Section label */}
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-base-content/40 select-none">
            Menu
          </p>

          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const isActive = currentPath === to;
            return (
              <Link
                key={to}
                to={to}
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5
                  rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-primary text-primary-content shadow-md shadow-primary/20"
                      : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-content/50 rounded-r-full" />
                )}

                <Icon
                  className={`
                    size-[18px] shrink-0
                    transition-transform duration-200
                    group-hover:scale-110
                    ${isActive ? "text-primary-content" : "text-base-content/50"}
                  `}
                />
                <span>{label}</span>

                {/* Optional: notification badge for Notifications */}
                {label === "Notifications" && (
                  <span className="ml-auto size-2 rounded-full bg-error animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── User Profile Section ───────────────────────── */}
        <div className="p-3 border-t border-base-200">
          {/* Profile Link */}
          <Link
            to="/profile"
            className="
              flex items-center gap-3 p-2.5 rounded-xl
              hover:bg-base-200 transition-all duration-200
              group mb-1
            "
          >
            <div className="relative shrink-0">
              <Avatar
                src={authUser?.profilePic}
                alt={authUser?.fullName}
                size="sm"
              />
              {/* Online dot */}
              <span
                className="
                absolute bottom-0 right-0
                size-2.5 rounded-full bg-success
                ring-2 ring-base-100
              "
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate leading-tight">
                {authUser?.fullName}
              </p>
              <p className="text-xs text-base-content/50 truncate">
                @{authUser?.username ?? "you"}
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
