import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";

import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationPage from "./pages/NotificationPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";

import { axiosInstance } from "./lib/axios.js";

function App() {
  // ==========================================
  // Get Authenticated User
  // ==========================================
  const {
    data: authData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["authUser"],

    queryFn: async () => {
      const res = await axiosInstance.get("/auth/me");
      return res.data;
    },

    retry: false,
  });

  // ==========================================
  // Extract User
  // ==========================================
  const authUser = authData?.user;

  // ==========================================
  // Debug
  // ==========================================
  console.log("Auth User:", authUser);
  console.log("Loading:", isLoading);
  console.log("Error:", error);

  // ==========================================
  // Loading
  // ==========================================
  if (isLoading) {
    return (
      <div
        data-theme="retro"
        className="min-h-screen bg-base-100 flex items-center justify-center"
      >
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // ==========================================
  // App
  // ==========================================
  return (
    <div
      data-theme="retro"
      className="min-h-screen bg-base-100 text-base-content"
    >
      <Routes>
        {/* ======================================
            Protected Routes
        ====================================== */}

        <Route
          path="/"
          element={
            authUser ? (
              authUser.isOnBoarded ? (
                <HomePage />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/notifications"
          element={
            authUser ? (
              authUser.isOnBoarded ? (
                <NotificationPage />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/chat"
          element={
            authUser ? (
              authUser.isOnBoarded ? (
                <ChatPage />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/call"
          element={
            authUser ? (
              authUser.isOnBoarded ? (
                <CallPage />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ======================================
            Onboarding
        ====================================== */}

        <Route
          path="/onboarding"
          element={
            authUser ? (
              authUser.isOnBoarded ? (
                <Navigate to="/" replace />
              ) : (
                <OnboardingPage />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ======================================
            Public Auth Routes
        ====================================== */}

        <Route
          path="/login"
          element={
            !authUser ? (
              <LoginPage />
            ) : authUser.isOnBoarded ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/onboarding" replace />
            )
          }
        />

        <Route
          path="/signup"
          element={
            !authUser ? (
              <SignUpPage />
            ) : authUser.isOnBoarded ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/onboarding" replace />
            )
          }
        />

        {/* ======================================
            404
        ====================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to={authUser ? "/" : "/login"}
              replace
            />
          }
        />
      </Routes>

      <Toaster />
    </div>
  );
}

export default App;