import { Navigate, Outlet } from "react-router";
import { useContext } from "react";
import { AppContext } from "../../context/app_context";

/**
 * @param {boolean} requireAuth
 */
const AuthRoute = ({ requireAuth }) => {
  const { isLoggedIn, loading } = useContext(AppContext);

  if (loading) return null;

  if (requireAuth && !isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!requireAuth && isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise, render the child route
  return <Outlet />;
};

export default AuthRoute;
