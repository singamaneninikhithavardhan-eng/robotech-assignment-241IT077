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

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      navigate("/");
    }
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/login/", { username, password });

      localStorage.setItem("accessToken", res.data.access);
      localStorage.setItem("refreshToken", res.data.refresh);

      // Navigate to Home Page on success
      navigate("/");
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
          Login
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
          className="w-full p-3 mb-4 rounded text-base border-2 border-slate-700 bg-slate-900 focus:border-blue-500 focus:outline-none transition-colors"
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
            className="w-full p-3 pr-12 rounded text-base border-2 border-slate-700 bg-slate-900 focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 text-lg hover:text-white transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            )}
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className={`w-full py-3 rounded text-base font-medium transition ${loading
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-blue-600 active:bg-blue-700 hover:bg-blue-500"
            }`}
        >
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>

      {/* Back to Home */}
      <Link
        to="/"
        className="mt-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2 group text-sm"
      >
        <svg
          className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Link>

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
