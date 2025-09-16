import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

const apiUrl = "http://127.0.0.1:8000";

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

    // --- THIS IS THE GUARANTEED FIX ---
    // If the error is a 401 and the request was for the login or refresh token endpoint,
    // we must NOT try to refresh the token. We just pass the error along.
    if (error.response.status === 401 && originalRequest.url.includes("/api/token")) {
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