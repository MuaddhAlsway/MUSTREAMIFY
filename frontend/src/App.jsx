import { Routes, Route } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
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
    data: authUser,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["authUser"],

    queryFn: async () => {
      const res = await axiosInstance.get("/auth/me");

      return res.data;
    },

    retry: false, // auth check
  });

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
      <button
        onClick={() => toast.success("Hello world")}
        className="btn btn-primary"
      >
        Create A Toast
      </button>

      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route
          path="/signup"
          element={<SignUpPage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/notifications"
          element={<NotificationPage />}
        />

        <Route
          path="/call"
          element={<CallPage />}
        />

        <Route
          path="/chat"
          element={<ChatPage />}
        />

        <Route
          path="/onboarding"
          element={<OnboardingPage />}
        />
      </Routes>

      <Toaster />
    </div>
  );
}

export default App;