import { Navigate, Outlet } from "react-router";
import { useContext } from "react";
import { AppContext } from "../../context/app_context";

/**
 * @param {boolean} requireAuth
 */

export const AuthRoute = ({ requireAuth, allowedRoles }) => {
  const { isLoggedIn, loading, userData } = useContext(AppContext);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const role = userData?.role;

  if (requireAuth && !isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (requireAuth && allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (!requireAuth && isLoggedIn) {
    return <Navigate to={`/dashboard`} replace />;
  }

  return <Outlet />;
};
