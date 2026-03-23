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

// ✅ All lazy
const Navigation = lazy(() => import("./components/navbar"));
const Footer = lazy(() => import("./components/footer"));
const Hero = lazy(() => import("./pages/hero"));
const Register = lazy(() => import("./pages/auth/register"));
const Login = lazy(() => import("./pages/auth/login"));
const Email_verification = lazy(
  () => import("./pages/auth/email_verification"),
);
const Reset_password = lazy(() => import("./pages/auth/reset_password"));
const Admin_Dashboard = lazy(() => import("./pages/dashboard/admin/dashboard"));
const Employee_Dashboard = lazy(
  () => import("./pages/dashboard/employee/dashboard"),
);
const BudgetPlanner = lazy(() => import("./pages/dashboard/budget_planner"));
const CalorieCounter = lazy(() => import("./pages/dashboard/calorie_counter"));
const Documentation = lazy(() => import("./pages/dashboard/documentation"));
const MobileProfile = lazy(() => import("./pages/profile/mobile_profile"));
const DesktopProfile = lazy(() => import("./pages/profile/desktop_profile"));
const Edit_profile = lazy(() => import("./pages/profile/edit_profile"));
const Todo = lazy(() => import("./pages/dashboard/todo"));
const SavingsTracker = lazy(() => import("./pages/dashboard/savings_tracker")); // ✅ was eagerly imported

const authLoader = async () => {
  const BACKEND_URL = "http://localhost:4000";
  axios.defaults.withCredentials = true;
  try {
    const { data } = await axios.get(`${BACKEND_URL}/api/auth/is-auth`, {
      withCredentials: true,
    });
    if (data.success) {
      const res = await axios.get(`${BACKEND_URL}/api/user/data`);
      return { isLoggedIn: true, userData: res.data.userData };
    }
    return { isLoggedIn: false, userData: null };
  } catch (error) {
    return { isLoggedIn: false, userData: null };
  }
};

const DashboardRedirect = () => {
  const { userData } = useContext(AppContext);
  if (userData?.role === "admin")
    return <Navigate to="/dashboard/admin" replace />;
  if (userData?.role === "employee")
    return <Navigate to="/dashboard/employee" replace />;
  return <Navigate to="/login" replace />;
};

const App_layout = () => (
  <div className="w-full h-full">
    <div className="bg-white w-full h-fit relative">
      <Navigation />
      <Outlet />
      {/* <Footer /> */}
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
            {/* <Footer /> */}
          </div>
        </div>
      </main>
    </div>
  </div>
);

// ✅ ProfileGate no longer wraps Dashboard_layout manually — it's handled via the route tree
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
      <Route element={<App_layout />}>
        <Route index element={<Hero />} />
      </Route>

      <Route element={<AuthRoute requireAuth={true} />}>
        <Route path="dashboard" element={<DashboardRedirect />} />

        {/* ADMIN */}
        <Route
          element={<AuthRoute requireAuth={true} allowedRoles={["admin"]} />}
        >
          <Route element={<Dashboard_layout />}>
            <Route path="dashboard/admin" element={<Admin_Dashboard />} />
            <Route
              path="dashboard/admin/budget-planner"
              element={<BudgetPlanner />}
            />
            <Route path="dashboard/admin/todo-app" element={<Todo />} />
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
            <Route path="profile" element={<ProfileGate />} />{" "}
            {/* ✅ Desktop profile gets Dashboard_layout via route */}
          </Route>
        </Route>

        {/* EMPLOYEE */}
        <Route
          element={<AuthRoute requireAuth={true} allowedRoles={["employee"]} />}
        >
          <Route element={<Dashboard_layout />}>
            <Route path="dashboard/employee" element={<Employee_Dashboard />} />
            <Route path="dashboard/employee/todo-app" element={<Todo />} />
            <Route
              path="dashboard/employee/calorie-counter"
              element={<CalorieCounter />}
            />
            <Route path="profile" element={<ProfileGate />} />{" "}
            {/* ✅ Same for employee */}
          </Route>
        </Route>

        <Route path="edit-profile" element={<Edit_profile />} />
        <Route path="verify-account" element={<Email_verification />} />
      </Route>

      <Route element={<AuthRoute requireAuth={false} />}>
        <Route
          path="register"
          element={
            <div className="bg-linear-to-br from-primary via-second-gradient to-third-gradient">
              <Register />
            </div>
          }
        />
        <Route
          path="login"
          element={
            <div className="bg-linear-to-br from-primary via-second-gradient to-third-gradient">
              <Login />
            </div>
          }
        />
        <Route path="reset-password" element={<Reset_password />} />
      </Route>
    </Route>,
  ),
);

export default function App() {
  return <RouterProvider router={router} />;
}
