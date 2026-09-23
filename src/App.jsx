import { useContext } from "react";
import axios from "axios";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Outlet,
  Route,
  RouterProvider,
  Navigate,
  useLoaderData,
} from "react-router";
import { AuthRoute } from "./pages/auth/routes";
import { AppContext, AppContextProvider } from "./context/app_context";
import { useIsMobile } from "./hooks/use_is_mobile";
import Sidebar from "./components/sidebar";

// ─── Public ──────────────────────────────────────────────────
import Hero from "./pages/public/hero";
import Navigation from "./components/navbar";

// ─── Auth ────────────────────────────────────────────────────
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import Reset_password from "./pages/auth/reset_password";
import Email_verification from "./pages/auth/email_verification";

// ─── Admin ───────────────────────────────────────────────────
import AdminDashboard from "./pages/admin/admin_dashboard";
import AdminInventory from "./pages/admin/admin_inventory";
import StaffManagement from "./pages/_shared/staff_management";
import AdminOrderHistory from "./pages/admin/admin_history";
// ─── Manager ─────────────────────────────────────────────────
import ManagerDashboard from "./pages/manager/manager_dashboard";
import ManagerInventory from "./pages/manager/manager_inventory";
import ManagerOrderHistory from "./pages/manager/manager_history";

// ─── Employee ────────────────────────────────────────────────
import Staff_inventory from "./pages/employee/staff_inventory";
import EmployeeOrderHistory from "./pages/employee/order_history";

// ─── Shared ──────────────────────────────────────────────────
import Pos from "./pages/_shared/pos";
import MobileProfile from "./pages/profile/mobile_profile";
import DesktopProfile from "./pages/profile/desktop_profile";
import Edit_profile from "./pages/profile/edit_profile";

// ─── Temp ────────────────────────────────────────────────────
// Employee still reuses AdminDashboard until employee_dashboard.jsx is built.
const Dashboard = AdminDashboard;

// ─── Config ──────────────────────────────────────────────────
const BACKEND_URL = "http://localhost:4000";

const authLoader = async () => {
  axios.defaults.withCredentials = true;
  try {
    const { data } = await axios.get(`${BACKEND_URL}/api/auth/is-auth`);
    if (data.success) return { isLoggedIn: true, userData: data.userData };
    return { isLoggedIn: false, userData: null };
  } catch {
    return { isLoggedIn: false, userData: null };
  }
};

// ─── Redirect ────────────────────────────────────────────────
const DashboardRedirect = () => {
  const { userData, loading } = useContext(AppContext);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  if (userData?.role === "admin")
    return <Navigate to="/admin/dashboard" replace />;
  if (userData?.role === "branch_manager")
    return <Navigate to="/branch_manager/dashboard" replace />;
  if (userData?.role === "employee")
    return <Navigate to="/employee/dashboard" replace />;

  return <Navigate to="/login" replace />;
};

// ─── Layouts ─────────────────────────────────────────────────
const App_layout = () => (
  <div className="w-full h-full">
    <div className="bg-white w-full h-fit relative">
      <Navigation />
      <Outlet />
    </div>
  </div>
);

const Dashboard_layout = () => (
  <div className="flex w-full min-h-screen font-inter overflow-x-hidden">
    <div className="hidden md:block z-100">
      <Sidebar />
    </div>
    <div className="md:hidden fixed inset-0 z-50">
      <Navigation />
    </div>
    <div className="flex flex-col flex-1 min-w-0 pt-12 md:pt-0">
      <main className="flex-1 transition-all duration-300 md:ml-20 lg:ml-[220px]">
        <div className="min-h-full w-full bg-[#F3F3FF] md:rounded-tl-3xl relative overflow-hidden p-4">
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
              backgroundSize: "30px 30px",
            }}
          />
          <div className="relative z-10 max-w-[1500px] mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  </div>
);

// ─── Gates ───────────────────────────────────────────────────
const ProfileGate = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileProfile /> : <DesktopProfile />;
};

const Root = () => {
  const initialAuth = useLoaderData();
  return (
    <AppContextProvider initialAuth={initialAuth}>
      <Outlet />
    </AppContextProvider>
  );
};

const HydrateFallback = () => (
  <div className="h-screen flex items-center justify-center">Loading...</div>
);

// ─── Router ──────────────────────────────────────────────────
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path="/"
      element={<Root />}
      loader={authLoader}
      HydrateFallback={HydrateFallback}
    >
      {/* ─── Public ─── */}
      <Route element={<App_layout />}>
        <Route index element={<Hero />} />
      </Route>

      {/* ─── Unauthorized ─── */}
      <Route
        path="unauthorized"
        element={
          <div className="h-screen flex flex-col items-center justify-center gap-4">
            <p className="text-5xl">🚫</p>
            <p className="text-lg font-bold text-gray-800">Access Denied</p>
            <p className="text-sm text-gray-400">
              You don't have permission to view this page.
            </p>
            <a
              href="/dashboard"
              className="text-sm text-indigo-600 hover:underline"
            >
              Go back to dashboard
            </a>
          </div>
        }
      />

      {/* ─── Guest ─── */}
      <Route element={<AuthRoute requireAuth={false} />}>
        <Route
          path="login"
          element={
            <div className="bg-linear-to-br from-primary via-second-gradient to-third-gradient">
              <Login />
            </div>
          }
        />
        <Route
          path="register"
          element={
            <div className="bg-linear-to-br from-primary via-second-gradient to-third-gradient">
              <Register />
            </div>
          }
        />
        <Route path="reset-password" element={<Reset_password />} />
      </Route>

      {/* ─── Protected ─── */}
      <Route element={<AuthRoute requireAuth={true} />}>
        <Route path="dashboard" element={<DashboardRedirect />} />

        {/* ─── Admin ─── */}
        <Route
          element={<AuthRoute requireAuth={true} allowedRoles={["admin"]} />}
        >
          <Route element={<Dashboard_layout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
            <Route
              path="/admin/staff-management"
              element={<StaffManagement />}
            />
            <Route path="/admin/pos" element={<Pos />} />
            <Route path="/admin/history" element={<AdminOrderHistory />} />
          </Route>
        </Route>

        {/* ─── Manager ─── */}
        <Route
          element={
            <AuthRoute requireAuth={true} allowedRoles={["branch_manager"]} />
          }
        >
          <Route element={<Dashboard_layout />}>
            <Route
              path="/branch_manager/dashboard"
              element={<ManagerDashboard />}
            />
            <Route
              path="/branch_manager/inventory"
              element={<ManagerInventory />}
            />
            <Route path="/branch_manager/pos" element={<Pos />} />
            <Route
              path="/branch_manager/history"
              element={<AdminOrderHistory />}
            />
          </Route>
        </Route>

        {/* ─── Employee ─── */}
        <Route
          element={<AuthRoute requireAuth={true} allowedRoles={["employee"]} />}
        >
          <Route element={<Dashboard_layout />}>
            <Route path="/employee/dashboard" element={<Dashboard />} />
            <Route path="/employee/inventory" element={<Staff_inventory />} />
            <Route path="/employee/pos" element={<Pos />} />
            <Route
              path="/employee/history"
              element={<EmployeeOrderHistory />}
            />
          </Route>
        </Route>

        {/* ─── Shared ─── */}
        <Route element={<Dashboard_layout />}>
          <Route path="profile" element={<ProfileGate />} />
          <Route path="edit-profile" element={<Edit_profile />} />
          <Route path="verify-account" element={<Email_verification />} />
        </Route>
      </Route>
    </Route>,
  ),
);

export default function App() {
  return <RouterProvider router={router} />;
}
