import { createContext, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { AUTH_EXPIRED_EVENT } from "../lib/api";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getUserData = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/user/data");

      if (data.success) {
        setIsLoggedIn(true);
        setUserData(data.userData);
      } else {
        setIsLoggedIn(false);
        setUserData(null);
      }
    } catch {
      setIsLoggedIn(false);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getUserData();
  }, [getUserData]);

  // Any API call that comes back 401 (expired token, deactivated account)
  // logs the user out so AuthRoute sends them to /login.
  useEffect(() => {
    const on_expired = () => {
      setIsLoggedIn(false);
      setUserData(null);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, on_expired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, on_expired);
  }, []);

  const value = {
    isLoggedIn,
    userData,
    loading,
    setIsLoggedIn,
    setUserData,
    getUserData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
