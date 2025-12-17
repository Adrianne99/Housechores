import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  axios.defaults.withCredentials = true;

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuthState = async () => {
    try {
      const { data } = await axios.get(BACKEND_URL + "/api/auth/is-auth");

      if (data.success) {
        setIsLoggedIn(true);
        getUserData();
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    getAuthState();
  }, []);

  const getUserData = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/user/data`);
      // data.success ? setUserData(data.userData) : console.log("data not found");

      if (data.success) {
        setUserData(data.userData);
        setIsLoggedIn(true);
      } else {
        setUserData(null);
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.log(error);
      setUserData(null);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    BACKEND_URL: BACKEND_URL,
    isLoggedIn,
    setIsLoggedIn,
    userData,
    setUserData,
    getUserData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
