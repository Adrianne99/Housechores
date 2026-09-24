import { createContext, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { queryClient } from "../lib/query";

export const AppContext = createContext();

// The signed-in user comes from the ["me"] query (no mount effect).
// null = signed out.
const fetch_me = async () => {
  try {
    const { data } = await axios.get("/api/user/data");
    return data.success ? data.userData : null;
  } catch {
    return null;
  }
};

export const AppContextProvider = ({ children }) => {
  const me = useQuery({
    queryKey: ["me"],
    queryFn: fetch_me,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const userData = me.data ?? null;

  const setUserData = useCallback((value) => {
    queryClient.setQueryData(["me"], value ?? null);
  }, []);

  // Kept for existing callers: logging in always also calls setUserData,
  // so only "false" (sign out) needs to do anything here.
  const setIsLoggedIn = useCallback((value) => {
    if (!value) queryClient.setQueryData(["me"], null);
  }, []);

  const getUserData = useCallback(() => me.refetch(), [me]);

  const value = {
    isLoggedIn: !!userData,
    userData,
    loading: me.isPending,
    setIsLoggedIn,
    setUserData,
    getUserData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
