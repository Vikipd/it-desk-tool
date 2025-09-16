import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

// --- THIS IS THE GUARANTEED FIX for DEPLOYMENT ---
// This line tells the application:
// 1. If we are running a production build (npm run build), use the API URL we provide in the command.
// 2. Otherwise, for local development (npm start), default to the local server.
const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
// --- END OF FIX ---

const api = axios.create({
  baseURL: apiUrl,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest.url.includes("/api/token")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(REFRESH_TOKEN);
      if (refreshToken) {
        try {
          const res = await axios.post(`${apiUrl}/api/token/refresh/`, { refresh: refreshToken });
          const newAccessToken = res.data.access;

          localStorage.setItem(ACCESS_TOKEN, newAccessToken);
          
          if (res.data.refresh) {
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
          }

          api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
          originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
          
          processQueue(null, newAccessToken);
          return api(originalRequest);

        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;