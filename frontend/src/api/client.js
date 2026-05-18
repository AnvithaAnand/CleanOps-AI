import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  headers: { "Content-Type": "application/json" },
});

// Attach stored token on every request
const TOKEN_KEY = "cleanops_token";
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// On 401, clear session and redirect to login
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("cleanops_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default client;
