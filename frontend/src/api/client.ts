import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  // withCredentials MUST be false when using JWT Bearer tokens.
  // withCredentials:true + allow_origins:"*" causes browsers to block all requests.
  withCredentials: false,
});

// Token getter registered once from AuthInitializer
let getTokenFn: (() => Promise<string | null>) | null = null;

export const setApiTokenGetter = (tokenGetter: () => Promise<string | null>) => {
  getTokenFn = tokenGetter;
};

// Attach Clerk JWT to every outgoing request
api.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    try {
      const token = await getTokenFn();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn("[API] getTokenFn returned null — no Authorization header set");
      }
    } catch (error) {
      console.error("[API] Failed to get Clerk token:", error);
    }
  } else {
    console.warn("[API] getTokenFn not registered yet");
  }
  return config;
});

// Log 401s clearly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("[API] 401 Unauthorized — token missing or invalid:", error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;
