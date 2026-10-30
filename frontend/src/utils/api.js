const configuredApiUrl = import.meta.env.VITE_API_URL;
const developmentApiUrl =
  import.meta.env.DEV && typeof window !== "undefined"
    ? "http://localhost:5000"
    : "";

export const API_BASE_URL = (
  configuredApiUrl ||
  developmentApiUrl ||
  (typeof window !== "undefined" ? window.location.origin : "")
).replace(/\/+$/, "");

export const apiUrl = (path) =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const getItemImageUrl = (url) => {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:image/")
  ) {
    return url;
  }
  return apiUrl(url.startsWith("/") ? url : `/${url}`);
};
