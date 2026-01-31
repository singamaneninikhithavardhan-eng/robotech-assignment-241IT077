import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { buildMediaUrl } from "../utils/mediaUrl";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const res = await api.get("/events/");
      setEvents(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          Loading events…
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* ================= BACKGROUND VIDEO ================= */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="fixed inset-0 w-full h-full object-cover -z-20"
        poster="/eventsBgPoster.png"
      >
        <source src="/eventsBg.mp4" type="video/mp4" />
      </video>

      {/* ================= OVERLAY ================= */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] -z-10" />

      {/* ================= CONTENT ================= */}
      <main className="text-white pt-28  relative z-10">
        <div className="max-w-6xl mx-auto px-6 pb-20">

          {/* UPCOMING & CURRENT SECTION */}
          <div className="mb-20">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-1 bg-cyan-500 rounded-full"></div>
              <h2 className="text-2xl font-[Orbitron] font-black uppercase tracking-widest text-cyan-400">Current & Upcoming</h2>
            </div>

            <div className="space-y-12">
              {events.filter(e => new Date(e.date) >= new Date()).length === 0 && (
                <p className="text-gray-500 italic">No upcoming events scheduled at this time.</p>
              )}

              {events
                .filter(e => new Date(e.date) >= new Date())
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(event => (
                  <article key={event.id} className="rounded-2xl overflow-hidden bg-[#121216] shadow-2xl border border-cyan-500/20 flex flex-col md:flex-row group hover:border-cyan-500/50 transition-all">
                    <div className="md:w-5/12 h-64 md:h-auto relative overflow-hidden">
                      {event.image ? (
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black/50 text-gray-700 font-black tracking-widest text-2xl">ROBOTECH</div>
                      )}
                      <div className="absolute top-4 left-4 bg-cyan-500 text-black font-black px-4 py-2 rounded-lg text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] uppercase tracking-wider">
                        {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col justify-between">
                      <div>
                        <h2 className="text-3xl font-black font-[Orbitron] text-white mb-3 group-hover:text-cyan-400 transition-colors uppercase">{event.title}</h2>
                        {event.location && <p className="text-gray-400 text-sm mb-6 flex items-center gap-2"><span className="text-cyan-500">📍</span> {event.location}</p>}
                        {event.description && <div className="text-gray-400 leading-relaxed mb-8 line-clamp-3 text-sm" dangerouslySetInnerHTML={{ __html: event.description }}></div>}
                      </div>
                      {event.registration_link && (
                        <div>
                          <a href={event.registration_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-cyan-500/20 transform hover:-translate-y-1 uppercase tracking-widest text-xs">
                            Register Now
                          </a>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
            </div>
          </div>

          {/* PAST SECTION */}
          <div>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-1 bg-gray-700 rounded-full"></div>
              <h2 className="text-xl font-[Orbitron] font-bold uppercase tracking-widest text-gray-500">Past Events</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {events.filter(e => new Date(e.date) < new Date()).length === 0 && (
                <p className="text-gray-600 italic">No past events recorded.</p>
              )}

              {events
                .filter(e => new Date(e.date) < new Date())
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(event => (
                  <article key={event.id} className="rounded-2xl overflow-hidden bg-white/5 border border-white/5 flex flex-col group hover:bg-white/10 hover:border-white/10 transition-all">
                    <div className="h-48 relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500">
                      {event.image ? (
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black/30"></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold font-[Orbitron] text-gray-300 group-hover:text-white mb-1 uppercase truncate">{event.title}</h3>
                        <p className="text-xs text-gray-500 font-mono">{new Date(event.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="text-xs text-gray-500 line-clamp-3 mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: event.description }}></div>

                      <Link to={`/events/${event.id}/gallery`} className="w-full flex items-center justify-center gap-2 py-3 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-400 hover:bg-white hover:text-black transition-all">
                        View Gallery ↗
                      </Link>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
