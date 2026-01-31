import { buildMediaUrl } from "../utils/mediaUrl";

export default function GalleryModal({ image, onClose }) {
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="relative max-w-5xl w-full">

        {/* BACK BUTTON */}
        <button
          onClick={onClose}
          className="absolute -top-12 left-0 text-cyan-400 text-sm flex items-center gap-2 hover:underline"
        >
          ← Back to Gallery
        </button>

        {/* IMAGE */}
        <img
          src={buildMediaUrl(image.image_path)}
          alt="Gallery"
          className="w-full max-h-[85vh] object-contain rounded-xl shadow-lg"
        />
      </div>
    </div>
  );
}
