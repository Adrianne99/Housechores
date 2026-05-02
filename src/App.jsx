import { Suspense, lazy, useContext } from "react";
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
import { StaffManagement } from "./pages/staff_management";

const Pos = lazy(() => import("./pages/pos/pos"));
const Navigation = lazy(() => import("./components/navbar"));
const Hero = lazy(() => import("./pages/hero"));
const Register = lazy(() => import("./pages/auth/register"));
const Login = lazy(() => import("./pages/auth/login"));
const Email_verification = lazy(
  () => import("./pages/auth/email_verification"),
);
const Reset_password = lazy(() => import("./pages/auth/reset_password"));
const Dashboard = lazy(() => import("./pages/dashboard/dashboard"));
const Inventory = lazy(() => import("./pages/dashboard/inventory"));
const CalorieCounter = lazy(() => import("./pages/dashboard/calorie_counter"));
const Documentation = lazy(() => import("./pages/dashboard/documentation"));
const MobileProfile = lazy(() => import("./pages/profile/mobile_profile"));
const DesktopProfile = lazy(() => import("./pages/profile/desktop_profile"));
const Edit_profile = lazy(() => import("./pages/profile/edit_profile"));
const Todo = lazy(() => import("./pages/dashboard/todo"));
const SavingsTracker = lazy(() => import("./pages/dashboard/savings_tracker"));

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

// ── Fix: added loading guard + branch_manager redirect ─────────
const DashboardRedirect = () => {
  const { userData, loading } = useContext(AppContext);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  if (userData?.role === "admin")
    return <Navigate to="/dashboard/admin" replace />;
  if (userData?.role === "branch_manager")
    return <Navigate to="/dashboard/branch-manager" replace />;
  if (userData?.role === "employee")
    return <Navigate to="/dashboard/employee" replace />;

  return <Navigate to="/login" replace />;
};

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

const ProfileGate = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileProfile /> : <DesktopProfile />;
};

const Root = () => {
  const initialAuth = useLoaderData();
  return (
    <AppContextProvider initialAuth={initialAuth}>
      <Suspense fallback={<div>Loading Page....</div>}>
        <Outlet />
      </Suspense>
    </AppContextProvider>
  );
};

const HydrateFallback = () => (
  <div className="h-screen flex items-center justify-center">Loading...</div>
);

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path="/"
      element={<Root />}
      loader={authLoader}
      HydrateFallback={HydrateFallback}
    >
      {/* Public pages */}
      <Route element={<App_layout />}>
        <Route index element={<Hero />} />
      </Route>

      {/* Unauthorized page */}
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

      {/* Guest-only pages */}
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

      {/* Protected pages */}
      <Route element={<AuthRoute requireAuth={true} />}>
        <Route path="dashboard" element={<DashboardRedirect />} />

        {/* ADMIN routes */}
        <Route
          element={<AuthRoute requireAuth={true} allowedRoles={["admin"]} />}
        >
          <Route element={<Dashboard_layout />}>
            <Route path="dashboard/admin" element={<Dashboard />} />
            <Route path="dashboard/admin/inventory" element={<Inventory />} />
            <Route path="dashboard/admin/todo-app" element={<Todo />} />
            <Route path="dashboard/admin/pos" element={<Pos />} />
            <Route
              path="dashboard/admin/staff-management"
              element={<StaffManagement />}
            />
            <Route
              path="dashboard/admin/calorie-counter"
              element={<CalorieCounter />}
            />
            <Route
              path="dashboard/admin/savings-tracker"
              element={<SavingsTracker />}
            />
            <Route
              path="dashboard/admin/documentation"
              element={<Documentation />}
            />
          </Route>
        </Route>

        {/* BRANCH MANAGER routes */}
        <Route
          element={
            <AuthRoute requireAuth={true} allowedRoles={["branch_manager"]} />
          }
        >
          <Route element={<Dashboard_layout />}>
            <Route path="dashboard/branch_manager" element={<Dashboard />} />
            <Route
              path="dashboard/branch-manager/inventory"
              element={<Inventory />}
            />
          </Route>
        </Route>

        {/* EMPLOYEE routes */}
        <Route
          element={<AuthRoute requireAuth={true} allowedRoles={["employee"]} />}
        >
          <Route element={<Dashboard_layout />}>
            <Route path="dashboard/employee" element={<Dashboard />} />
            <Route path="dashboard/employee/message" element={<Todo />} />
            <Route
              path="dashboard/employee/inventory"
              element={<Inventory />}
            />
          </Route>
        </Route>

        {/* Shared protected routes */}
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
