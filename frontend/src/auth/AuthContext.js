import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/authApi";
import { clearTokens, getAccessToken, setTokens } from "./tokenStorage";
import { subscribeUnauthorized } from "../api/http";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const token = await getAccessToken();
        if (isMounted) setAccessToken(token);
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const unsub = subscribeUnauthorized(() => {
      setAccessToken(null);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async ({ username, password }) => {
    const tokens = await authApi.login({ username, password });
    await setTokens({ accessToken: tokens.access, refreshToken: tokens.refresh });
    setAccessToken(tokens.access);
  }, []);

  const signUp = useCallback(async ({ username, password }) => {
    const tokens = await authApi.register({ username, password });
    await setTokens({ accessToken: tokens.access, refreshToken: tokens.refresh });
    setAccessToken(tokens.access);
  }, []);

  const signOut = useCallback(async () => {
    await clearTokens();
    setAccessToken(null);
  }, []);

  const value = useMemo(
    () => ({
      isBootstrapping,
      isSignedIn: Boolean(accessToken),
      accessToken,
      signIn,
      signUp,
      signOut,
    }),
    [isBootstrapping, accessToken, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

