import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navbarRef = useRef(null);

  // Navbar background on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!navbarRef.current) return;

      if (window.scrollY > 50) {
        navbarRef.current.classList.add(
          "bg-[#0B0C10]",
          "backdrop-blur-md",
          "shadow-md"
        );
      } else {
        navbarRef.current.classList.remove(
          "bg-[#0B0C10]",
          "backdrop-blur-md",
          "shadow-md"
        );
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        ref={navbarRef}
        className={`fixed top-0 left-0 w-full h-20 z-50 transition-all duration-500 text-gray-200
    ${mobileOpen ? "opacity-0 pointer-events-none" : ""}
  `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logos */}
          <div className="flex items-center space-x-4">
            <img
              src="/robotech_nitk_logo.jpeg"
              alt="Robotech Logo"
              className="h-14 w-14 rounded-full object-contain"
            />
            <div className="w-px h-10 bg-cyan-400"></div>
            <img
              src="/nitk_logo.png"
              alt="NITK Logo"
              className="h-14 w-14 object-contain"
            />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 items-center text-sm font-medium">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/events" className="nav-link">Events</Link>

            <Link to="/team" className="nav-link">Team</Link>

            <a
              href="https://sim2real.nitk.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
            >
              Sim2Real
            </a>
            <Link to="/sponsorship" className="nav-link">Sponsor Us</Link>
            <Link to="/contactUs" className="nav-link">Contact Us</Link>
            <Link to="/announcements" className="nav-link">Announcements</Link>
            <Link to="/login" className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 rounded-md transition-colors">Login</Link>
          </div>

          {/* Mobile Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="focus:outline-none"
            >
              <svg
                className="w-8 h-8 text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Full-Screen Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[999] bg-[#0B0C10] text-gray-200 flex flex-col">
          {/* Header */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-white/10">
            <span className="text-lg font-semibold text-cyan-400">
              RoboTech
            </span>
            <button onClick={() => setMobileOpen(false)}>
              <svg
                className="w-8 h-8 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 flex flex-col justify-center px-8 space-y-6 text-lg font-medium">
            <Link onClick={() => setMobileOpen(false)} to="/" className="mobile-link">Home</Link>
            <Link onClick={() => setMobileOpen(false)} to="/events" className="mobile-link">Events</Link>

            <Link onClick={() => setMobileOpen(false)} to="/team" className="mobile-link">Team</Link>
            <a
              href="https://sim2real.nitk.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-link"
            >
              Sim2Real
            </a>
            <Link onClick={() => setMobileOpen(false)} to="/sponsorship" className="mobile-link">Sponsor Us</Link>
            <Link onClick={() => setMobileOpen(false)} to="/contactUs" className="mobile-link">Contact Us</Link>
            <Link onClick={() => setMobileOpen(false)} to="/announcements" className="mobile-link">Announcements</Link>
            <Link onClick={() => setMobileOpen(false)} to="/login" className="mobile-link text-cyan-400 font-semibold">Login</Link>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .nav-link {
          position: relative;
          color: #cbd5e1;
          transition: color 0.3s ease;
        }
        .nav-link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -4px;
          width: 0%;
          height: 2px;
          background: linear-gradient(90deg, #00fff2, #0077ff);
          transition: width 0.3s ease;
          border-radius: 1px;
        }
        .nav-link:hover::after {
          width: 100%;
        }
        .mobile-link {
          text-align: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
      `}</style>
    </>
  );
}
