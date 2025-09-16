// COPY AND PASTE THIS ENTIRE BLOCK INTO: frontend/src/api.js

import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

// --- FIX ---
// The base URL for your Django API is now correctly read from your .env file.
// Locally, this will be 'http://127.0.0.1:8000'.
// For production, it will be your live server's IP or domain.
const baseURL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: baseURL,
});
// --- END OF FIX ---


let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) { prom.reject(error); } 
    else { prom.resolve(token); }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) { config.headers.Authorization = `Bearer ${token}`; }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // --- FIX ---
    // The original logic was fine, just added a check for baseURL to avoid errors if it's not set.
    if (error.response?.status === 401 && baseURL && originalRequest.url === "/api/token/") {
      return Promise.reject(error);
    }
    // --- END OF FIX ---

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => { return Promise.reject(err); });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem(REFRESH_TOKEN);

      if (refreshToken) {
        try {
          // --- FIX ---
          // The refresh token call now correctly uses the baseURL to contact the backend,
          // whether it's local or on the live server.
          const res = await axios.post(`${baseURL}/api/token/refresh/`, { refresh: refreshToken });
          // --- END OF FIX ---
          
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