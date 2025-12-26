import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  axios.defaults.withCredentials = true;

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getUserData = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/user/data`, {
        withCredentials: true,
      });

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
      setLoading(false); // 👈 VERY IMPORTANT
    }
  };

  useEffect(() => {
    getUserData();
  }, []);

  const value = {
    BACKEND_URL,
    isLoggedIn,
    userData,
    loading,
    setIsLoggedIn,
    setUserData,
    getUserData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
