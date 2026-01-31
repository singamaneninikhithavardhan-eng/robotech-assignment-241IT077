import { useEffect, useState } from "react";
import { buildMediaUrl } from "../utils/mediaUrl";
import api from "../api/axios";

export default function ProjectModal({ projectId, onClose }) {
  const [project, setProject] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    async function loadProject() {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data);
    }
    loadProject();
  }, [projectId]);

  if (!project) return null;

  const images = project.images || [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-[#0b0c10] max-w-4xl w-full rounded-xl overflow-hidden border border-cyan-400/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-400/20">
          <h2 className="text-lg md:text-xl font-bold text-cyan-400">
            {project.title}
          </h2>

          {/* BACK BUTTON */}
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm rounded bg-black/40 border border-white/20 text-gray-200 hover:bg-white/10 transition"
          >
            ← Back
          </button>
        </div>

        {/* ===== IMAGE VIEWER ===== */}
        {images.length > 0 && (
          <div className="relative">
            <img
              src={buildMediaUrl(images[activeIndex])}
              className="w-full h-80 object-cover"
              loading="lazy"
              alt={project.title}
            />

            {/* THUMBNAILS */}
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto bg-black/40">
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={buildMediaUrl(img)}
                    onClick={() => setActiveIndex(i)}
                    className={`h-16 w-24 object-cover cursor-pointer border transition
                      ${i === activeIndex
                        ? "border-cyan-400"
                        : "border-transparent hover:border-white/30"
                      }`}
                    alt={`thumbnail-${i}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== CONTENT ===== */}
        <div className="p-6 text-white">
          <p className="text-sm text-gray-400 mb-4">
            Project Lead:{" "}
            <span className="text-cyan-300">{project.project_lead}</span>
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            {project.description}
          </p>

          {project.is_open_source && project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-cyan-400 hover:underline"
            >
              <i className="fa-brands fa-github" />
              View on GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
