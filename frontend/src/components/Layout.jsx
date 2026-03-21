import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = ({ children, showSidebar = false }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1 min-h-0">
        {showSidebar ? (
          <>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              {/* On mobile, Sidebar has its own toggle button — Navbar only for desktop nav actions */}
              <Navbar />
              <main className="flex-1 overflow-y-auto overflow-x-hidden">
                {children}
              </main>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col min-w-0">
            <Navbar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
              {children}
            </main>
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;
