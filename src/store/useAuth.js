// src/store/useAuth.js — Auth state AsyncStorage-ით
import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]     = useState(null);
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem("safepay_token");
        const u = await AsyncStorage.getItem("safepay_user");
        if (t) setToken(t);
        if (u) setUser(JSON.parse(u));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (newUser, newToken) => {
    setToken(newToken);
    setUser(newUser);
    await AsyncStorage.setItem("safepay_token", newToken);
    await AsyncStorage.setItem("safepay_user", JSON.stringify(newUser));
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem("safepay_token");
    await AsyncStorage.removeItem("safepay_user");
  }, []);

  const updateUser = useCallback(async (patch) => {
    setUser(prev => {
      const updated = { ...prev, ...patch };
      AsyncStorage.setItem("safepay_user", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
