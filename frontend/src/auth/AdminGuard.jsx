import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function AdminGuard({ children }) {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    // If no token, fail immediately
    if (!localStorage.getItem("accessToken")) {
      setAllowed(false);
      return;
    }

    api
      .get("/me/")
      .then(() => setAllowed(true))
      .catch(() => {
        // Token might be expired, try refreshing or logout
        setAllowed(false);
      });
  }, []);

  if (allowed === null) return <div className="p-10 text-center text-white">Loading...</div>; // Simple loading state
  return allowed ? children : <Navigate to="/login" />;
}
