import { useState, useRef, useEffect } from "react";
import api from "../../api/axios";
import { Link, useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const errorRef = useRef(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/token/", { username, password });

      localStorage.setItem("accessToken", res.data.access);
      localStorage.setItem("refreshToken", res.data.refresh);

      // Navigate to Dashboard on success
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Focus error for screen readers
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#020617] to-black flex flex-col items-center px-4">
      {/* ===== TOP LOGO ===== */}
      <Link
        to="/"
        aria-label="Go to RoboTech homepage"
        className="mt-10 mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
      >
        <img
          src="/robotech_nitk_logo.jpeg"
          alt="RoboTech"
          className="
            w-auto
            h-46 sm:h-46 md:h-46
            rounded-full
            
            p-4
            shadow-lg
            opacity-0 translate-y-2
            animate-logo-in
            motion-reduce:opacity-100 motion-reduce:translate-y-0
          "
        />
      </Link>

      {/* ===== LOGIN FORM ===== */}
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-transparent-800 p-6 sm:p-8 rounded text-white"
        aria-labelledby="login-heading"
      >
        <h2
          id="login-heading"
          className="text-xl sm:text-2xl font-semibold mb-6 text-center"
        >
          Admin Login
        </h2>

        {/* Error */}
        {error && (
          <div
            ref={errorRef}
            tabIndex="-1"
            role="alert"
            aria-live="assertive"
            className="mb-4 text-red-400 text-sm"
          >
            {error}
          </div>
        )}

        {/* Username */}
        <input
          type="text"
          autoComplete="username"
          className="w-full p-3 mb-4 rounded text-base"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-label="Username"
        />

        {/* Password */}
        <div className="relative mb-5">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="w-full p-3 pr-12 rounded text-base"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 text-lg"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className={`w-full py-3 rounded text-base font-medium transition ${loading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 active:bg-blue-700"
            }`}
        >
          {loading ? "Signing in…" : "Login"}
        </button>

        {/* Forgot password */}
        <div className="mt-4 text-center">
          <Link
            to="/admin/forgot-password"
            className="text-sm text-blue-400 underline-offset-2 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </form>

      {/* ===== LOGO ANIMATION ===== */}
      <style>
        {`
          @keyframes logo-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-logo-in {
            animation: logo-in 0.35s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}
