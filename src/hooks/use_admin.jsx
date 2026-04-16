import { AppContext } from "../context/app_context";
import { useContext } from "react";

export const useAdmin = () => {
  const { userData } = useContext(AppContext); // Assuming a base auth hook
  const isAdmin = userData?.role === "admin" || userData?.role === "employee";

  return { isAdmin };
};
