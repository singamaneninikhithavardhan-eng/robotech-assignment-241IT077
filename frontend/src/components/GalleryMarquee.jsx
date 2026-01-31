import { buildMediaUrl } from "../utils/mediaUrl";

export default function GalleryMarquee({ images, onOpen }) {
  if (!images || images.length === 0) return null;

  return (
    <div className="relative py-8 bg-black">
      {/* Film Strip Holes Top */}
      <div className="absolute top-0 left-0 w-full h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJub25lIj48cmVjdCB4PSI1IiB5PSIyIiB3aWR0aD0iMTAiIGhlaWdodD0iMTQiIHJ4PSIyIiBmaWxsPSIjMzMzIi8+PC9zdmc+')] repeat-x opacity-50 z-10" />

      {/* Scrolling Content */}
      <div className="overflow-hidden whitespace-nowrap">
        <div className="flex gap-0 animate-marquee items-center pl-4">
          {/* Double list for seamless loop */}
          {[...images, ...images].map((img, i) => (
            <div key={`${img.id}-${i}`} className="relative flex-shrink-0 px-4 group">
              {/* Frame border */}
              <div className="p-4 bg-black border-y-4 border-gray-900 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                <img
                  src={buildMediaUrl(img.image_path)}
                  alt={img.caption || "Gallery image"}
                  onClick={() => onOpen(img)}
                  loading="lazy"
                  className="h-64 w-96 object-cover grayscale group-hover:grayscale-0 transition-all duration-500 cursor-pointer border-2 border-transparent group-hover:border-cyan-500/50"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Film Strip Holes Bottom */}
      <div className="absolute bottom-0 left-0 w-full h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJub25lIj48cmVjdCB4PSI1IiB5PSI0IiB3aWR0aD0iMTAiIGhlaWdodD0iMTQiIHJ4PSIyIiBmaWxsPSIjMzMzIi8+PC9zdmc+')] repeat-x opacity-50 z-10" />
    </div>
  );
}
