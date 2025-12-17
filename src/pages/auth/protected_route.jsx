import { Navigate, Outlet } from "react-router";
import { useContext } from "react";
import { AppContext } from "../../context/app_context";

const ProtectedRoute = () => {
  const { isLoggedIn, loading } = useContext(AppContext);

  if (loading) return null;
  return isLoggedIn ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
