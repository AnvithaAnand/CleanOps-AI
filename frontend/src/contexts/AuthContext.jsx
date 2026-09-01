import { createContext, useContext, useState, useEffect, useCallback } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

const TOKEN_KEY = "cleanops_token";
const USER_KEY  = "cleanops_user";

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(false);

  // Attach / remove Authorization header whenever token changes
  useEffect(() => {
    if (token) {
      client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete client.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const saveSession = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    delete client.defaults.headers.common["Authorization"];
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await client.post("/api/auth/login", { email, password });
      saveSession(res.data);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.detail || "Login failed" };
    } finally {
      setLoading(false);
    }
  }, [saveSession]);

  const signup = useCallback(async (email, password, full_name) => {
    setLoading(true);
    try {
      const res = await client.post("/api/auth/signup", { email, password, full_name });
      saveSession(res.data);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.detail || "Signup failed" };
    } finally {
      setLoading(false);
    }
  }, [saveSession]);

  // Restore header on mount if token exists
  useEffect(() => {
    if (token) {
      client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser: (u) => { setUser(u); localStorage.setItem(USER_KEY, JSON.stringify(u)); }, token, loading, login, signup, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
