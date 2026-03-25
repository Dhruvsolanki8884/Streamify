import { Navigate, Route, Routes } from "react-router";

import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import IncomingCall from "./components/IncomingCall.jsx";

import { Toaster } from "react-hot-toast";

import PageLoader from "./components/pageLoader.jsx";
import useAuthUser from "./hooks/useAuthUser.js";
import Layout from "./components/Layout.jsx";
import { useThemeStore } from "./Store/useThemeStore.js";

// Routes that should render immediately without waiting for auth check
const PUBLIC_PATHS = ["/signup", "/login"];
// Routes that should render even while auth is loading (they handle their own loading state)
const STANDALONE_PATHS = ["/chat/", "/call/", "/onboarding", "/profile", "/notifications"];

const App = () => {
  const { isLoading, authUser } = useAuthUser();
  const { theme } = useThemeStore();

  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnboarded;

  const currentPath = window.location.pathname;
  const isPublicPath = PUBLIC_PATHS.some((p) => currentPath.startsWith(p));
  const isStandalonePath = STANDALONE_PATHS.some((p) => currentPath.startsWith(p));

  // Only block on loading for layout pages — standalone pages handle their own state
  if (isLoading && !isPublicPath && !isStandalonePath) return <PageLoader />;

  return (
    <div className="h-full" data-theme={theme}>
      <Routes>
        <Route
          path="/"
          element={
            isLoading ? (
              <PageLoader />
            ) : isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <HomePage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/signup" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/friends"
          element={
            isLoading ? (
              <PageLoader />
            ) : isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <HomePage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            !isLoading && isAuthenticated ? (
              <Navigate to={isOnboarded ? "/" : "/onboarding"} />
            ) : (
              <SignUpPage />
            )
          }
        />
        <Route
          path="/login"
          element={
            !isLoading && isAuthenticated ? (
              <Navigate to={isOnboarded ? "/" : "/onboarding"} />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/notifications"
          element={
            isLoading ? (
              <PageLoader />
            ) : isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <NotificationsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/call/:id"
          element={
            !isLoading && !isAuthenticated ? (
              <Navigate to="/login" />
            ) : (
              <CallPage />
            )
          }
        />
        <Route
          path="/chat/:id"
          element={
            !isLoading && !isAuthenticated ? (
              <Navigate to="/login" />
            ) : (
              <ChatPage />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isLoading ? (
              <PageLoader />
            ) : isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <ProfilePage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/onboarding"
          element={
            isLoading ? (
              <PageLoader />
            ) : isAuthenticated ? (
              !isOnboarded ? (
                <OnboardingPage />
              ) : (
                <Navigate to="/" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>

      <Toaster />
      {/* Global incoming call listener — shows popup to receiver from any page */}
      {isAuthenticated && <IncomingCall />}
    </div>
  );
};
export default App;
