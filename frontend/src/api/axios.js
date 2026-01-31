import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// REQUEST INTERCEPTOR: Add Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // If unauthorized, clear tokens to avoid sticky 401s on public pages
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }

    console.error("API Error:", error.response || error.message);
    return Promise.reject(error);
  }
);

// EXPORT MUST BE LAST
export default api;
