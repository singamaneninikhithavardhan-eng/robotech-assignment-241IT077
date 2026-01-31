import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { buildMediaUrl } from "../utils/mediaUrl";

/* =========================
   Skeleton Component
   ========================= */
function EventSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Banner skeleton */}
      <div className="h-56 sm:h-64 w-full bg-white/10 rounded-t-2xl" />

      <div className="p-5 sm:p-6 space-y-4">
        {/* Title */}
        <div className="h-7 w-3/4 bg-white/10 rounded" />

        {/* Venue */}
        <div className="h-4 w-1/3 bg-white/10 rounded" />

        {/* Paragraphs */}
        <div className="space-y-2 pt-2">
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-4 w-5/6 bg-white/10 rounded" />
        </div>

        {/* Button */}
        <div className="pt-4 border-t border-white/10">
          <div className="h-11 w-40 bg-white/10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* =========================
   Event Modal
   ========================= */
export default function EventModal({ eventId, onClose }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const startYRef = useRef(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    fetchEvent();

    const handleEsc = e => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [eventId, onClose]);

  async function fetchEvent() {
    try {
      setLoading(true);
      const res = await api.get(`/events/${eventId}`);
      setEvent(res.data);
    } catch (err) {
      console.error("Failed to load event", err);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  function onTouchStart(e) {
    startYRef.current = e.touches[0].clientY;
  }

  function onTouchMove(e) {
    const diff = e.touches[0].clientY - startYRef.current;
    if (diff > 120) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-3 sm:px-6">
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        className="
          relative w-full max-w-3xl max-h-[90vh] overflow-y-auto
          rounded-2xl bg-neutral-900/95 text-gray-100
          shadow-2xl border border-white/10
        "
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="
            absolute top-3 right-3 z-10
            bg-cyan-400 text-black font-semibold
            px-2 py-1 rounded-lg
            hover:bg-cyan-300 transition
          "
        >
          Back
        </button>

        {/* =====================
            LOADING STATE
           ===================== */}
        {loading && <EventSkeleton />}

        {/* =====================
            LOADED STATE
           ===================== */}
        {!loading && event && (
          <>
            {/* Banner */}
            {event.banner_image && (
              <img
                src={buildMediaUrl(`/media/events/${event.banner_image}`)}
                alt={event.title}
                loading="lazy"
                decoding="async"
                className="w-full h-56 sm:h-64 object-cover rounded-t-2xl"
              />
            )}

            {/* Content */}
            <div className="p-5 sm:p-6 space-y-5">
              <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400">
                {event.title}
              </h2>

              {event.venue && (
                <p className="text-sm text-gray-400">
                  📍 {event.venue}
                </p>
              )}

              <div
                className="prose prose-invert max-w-none
                           prose-p:text-gray-300
                           prose-a:text-cyan-400"
                dangerouslySetInnerHTML={{
                  __html: event.full_description
                }}
              />

              {event.external_links?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Related Links
                  </h3>
                  <ul className="space-y-2">
                    {event.external_links.map((link, i) => (
                      <li key={i}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline"
                        >
                          🔗 {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-white/10">
                {event.registration_open ? (
                  <a
                    href={event.external_registration_link}
                    target="_blank"
                    rel="noreferrer"
                    className="
                      inline-flex items-center justify-center
                      bg-cyan-500 hover:bg-cyan-600
                      text-black font-semibold
                      px-6 py-3 rounded-xl transition
                    "
                  >
                    Register Now
                  </a>
                ) : (
                  <span className="text-red-400 font-medium">
                    Registration Closed
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center sm:hidden">
                Swipe down to close
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
