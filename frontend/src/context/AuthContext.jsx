import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "../api/auth.js";
import { setUnauthorizedHandler } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const expiredRef = useRef(false);

  useEffect(() => {
    let active = true;
    authApi
      .fetchSession()
      .then((session) => active && !expiredRef.current && setUser(session))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      expiredRef.current = true;
      setUser(null);
      navigate("/login");
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    expiredRef.current = false;
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      navigate("/login");
    }
  }, [navigate]);

  const value = useMemo(
    () => ({ user, loading, login, logout, setUser }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
