import axios from "axios";

// Single place that configures how the app talks to the backend.
//
// - Development: leave VITE_BACKEND_URL empty. Requests go to "/api/..." on
//   the Vite dev server, which proxies them to http://localhost:4000
//   (see vite.config.js). Same origin, so cookies just work.
// - Production: set VITE_BACKEND_URL to the API origin, e.g.
//   https://api.example.com (and add the frontend origin to the backend's
//   CORS_ORIGINS).
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || "";
axios.defaults.withCredentials = true;

// Session expired / account deactivated → tell the app to log out.
// AppContext listens for this event and clears the user, which makes
// AuthRoute redirect to /login.
export const AUTH_EXPIRED_EVENT = "auth:expired";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? "";
    const is_auth_probe = url.includes("/api/user/data") || url.includes("/api/auth/");
    if (error.response?.status === 401 && !is_auth_probe) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);
