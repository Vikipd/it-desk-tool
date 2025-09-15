import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

// --- THIS IS THE FIX ---
// Use process.env for Create React App, not import.meta.env
// The variable name MUST start with REACT_APP_
const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
// --- END OF FIX ---

const api = axios.create({
  baseURL: apiUrl,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem(REFRESH_TOKEN);

      if (refreshToken) {
        try {
          const response = await axios.post(`${apiUrl}/api/token/refresh/`, {
            refresh: refreshToken,
          });

          if (response.status === 200) {
            const newAccessToken = response.data.access;
            localStorage.setItem(ACCESS_TOKEN, newAccessToken);
            api.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error(
            "Session has expired. Refresh token is invalid. Redirecting to login.",
            refreshError
          );
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        console.error("No refresh token available. Redirecting to login.");
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
