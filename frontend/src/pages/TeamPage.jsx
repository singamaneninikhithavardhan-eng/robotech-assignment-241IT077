import { useEffect, useState } from "react";
import api from "../api/axios";
import Navigation from "../components/Navbar";
import Footer from "../components/Footer";

export default function TeamPage() {
  const [data, setData] = useState({}); // { "Coding": [members], "Systems": [members] }
  const [loading, setLoading] = useState(true);

  // Filter state
  const [viewType, setViewType] = useState('current'); // 'current' or 'alumni'

  useEffect(() => {
    loadMembers();
  }, [viewType]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      // Fetch public members
      const res = await api.get("/team/public/", {
        params: { type: viewType }
      });

      // Group by SIG (or use backend grouping if preferred, but frontend is flexible)
      // Group logic: profile.sig
      const grouped = res.data.reduce((acc, user) => {
        const profile = user.profile || {};
        // Default SIG if empty
        const sig = profile.sig ? profile.sig : "General Members";
        if (!acc[sig]) acc[sig] = [];
        acc[sig].push(user);
        return acc;
      }, {});

      // Ensure standard SIGs appear in strict order if needed, but data-driven is better for CMS
      setData(grouped);

    } catch (err) {
      console.error("Failed to load team", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />

      {/* ================= HERO ================= */}
      <section className="relative min-h-[60vh] flex items-center justify-center text-center bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 via-black to-black z-0 pointer-events-none" />
        {/* Animated grid or noise can go here */}

        <div className="relative z-10 max-w-4xl px-4 mt-16">
          <h1 className="text-5xl md:text-7xl font-bold font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-6 animate-fade-in-up">
            Our Team
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto animate-fade-in-up delay-100">
            The distinct minds and passionate hearts driving innovation at Robotech NITK.
          </p>

          {/* Toggles */}
          <div className="flex justify-center gap-4 mt-8 animate-fade-in-up delay-200">
            <button
              onClick={() => setViewType('current')}
              className={`px-6 py-2 rounded-full font-bold transition-all ${viewType === 'current' ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              Current Members
            </button>
            <button
              onClick={() => setViewType('alumni')}
              className={`px-6 py-2 rounded-full font-bold transition-all ${viewType === 'alumni' ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              Alumni
            </button>
          </div>
        </div>
      </section>

      {/* ================= MEMBERS GRID ================= */}
      <section className="relative min-h-screen bg-black py-20 px-6">
        <div className="max-w-7xl mx-auto">

          {loading && (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-cyan-500 animate-pulse">Initializing Team Data...</p>
            </div>
          )}

          {!loading && Object.keys(data).length === 0 && (
            <div className="text-center py-20 text-gray-500">
              No members found in this category.
            </div>
          )}

          {!loading && Object.entries(data).sort().map(([sigName, members]) => (
            <div key={sigName} className="mb-24 animate-fade-in">
              {/* SIG Header */}
              <div className="flex items-center gap-4 mb-12">
                <h2 className="text-3xl font-bold text-white font-[Orbitron] uppercase tracking-wider">
                  {sigName}
                </h2>
                <div className="h-px bg-gradient-to-r from-cyan-500/50 to-transparent flex-1" />
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {members.map(user => (
                  <MemberCard key={user.id} user={user} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}

/* ================= MEMBER CARD COMPONENT ================= */
function MemberCard({ user }) {
  const profile = user.profile || {};
  const [isHovered, setIsHovered] = useState(false);

  // Use profile image or fallback
  const imgSrc = profile.image || null;

  return (
    <div
      className="group relative bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(6,182,212,0.15)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Area */}
      <div className="relative h-72 w-full bg-gray-900 overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={profile.full_name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-700">
            <span className="text-6xl font-bold opacity-20">{user.username[0]}</span>
          </div>
        )}

        {/* Overlay Gradient on Hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

        {/* Reveal Content on Hover */}
        <div className={`absolute bottom-0 left-0 w-full p-6 transform transition-transform duration-300 ${isHovered ? 'translate-y-0' : 'translate-y-10 opacity-0'}`}>
          <p className="text-gray-300 text-sm line-clamp-3 mb-4">
            {profile.description || "No bio available."}
          </p>

          {/* Social Icons */}
          <div className="flex gap-4 text-xl">
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="text-white hover:text-blue-400 transition transform hover:scale-110">
                <i className="fab fa-linkedin" />
                {/* Fallback if fontawesome not loaded: just text */}
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              </a>
            )}
            {profile.github_url && (
              <a href={profile.github_url} target="_blank" rel="noreferrer" className="text-white hover:text-gray-400 transition transform hover:scale-110">
                <span className="sr-only">GitHub</span>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              </a>
            )}
            {profile.instagram_url && (
              <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="text-white hover:text-pink-400 transition transform hover:scale-110">
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Basic Info (Visible Always) */}
      <div className="p-4 bg-[#0a0a0a]">
        <h3 className="text-white font-bold text-lg truncate">{profile.full_name || user.username}</h3>
        <div className="flex items-center justify-between mt-1 text-sm">
          <span className="text-cyan-400 font-medium">{profile.position || "Member"}</span>
          {profile.year && <span className="text-gray-500 text-xs border border-white/10 px-2 py-0.5 rounded">{profile.year}</span>}
        </div>
      </div>
    </div>
  );
}
