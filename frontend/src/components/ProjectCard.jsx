import { buildMediaUrl } from "../utils/mediaUrl";

export default function ProjectCard({ project, onOpen }) {
  return (
    <div
      className="
        relative
        rounded-xl
        overflow-hidden
        bg-white/5
        border border-cyan-400/20
      "
    >
      {/* Cover Image */}
      {project.cover_image ? (
        <img
          src={buildMediaUrl(project.cover_image)}
          alt={project.title}
          loading="lazy"
          className="w-full h-64 object-cover"
        />
      ) : (
        <div className="w-full h-64 bg-white/10 flex items-center justify-center text-gray-400">
          No Image
        </div>
      )}

      {/* Overlay Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-cyan-400">
          {project.title}
        </h3>
        {project.lead_details && (
          <p className="text-xs text-gray-400 mt-1">
            Lead: <span className="text-gray-300">{project.lead_details.profile?.full_name || project.lead_details.username}</span>
          </p>
        )}
      </div>

      {/* SEE BUTTON */}
      <button
        onClick={onOpen}
        className="
          absolute bottom-3 right-3
          bg-cyan-500 text-black
          text-sm font-semibold
          px-4 py-1.5 rounded
          hover:bg-cyan-600
          transition
        "
      >
        See
      </button>
    </div>
  );
}
