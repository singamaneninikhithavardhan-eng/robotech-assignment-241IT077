export function buildMediaUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL;

  if (!base || typeof base !== "string") {
    console.error("VITE_API_BASE_URL is not defined");
    return "";
  }

  if (!path || typeof path !== "string") {
    return "";
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const cleanBase = base.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${cleanBase}${cleanPath}`;
}
