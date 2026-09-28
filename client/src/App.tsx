import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import type { ReactNode } from "react";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./store/auth";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("access_token");
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const fetchMe = useAuth((s) => s.fetchMe);

  useEffect(() => {
    if (localStorage.getItem("access_token")) fetchMe();
  }, [fetchMe]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}