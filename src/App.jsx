import { useContext, lazy, Suspense } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Outlet,
  Route,
  RouterProvider,
  Navigate,
  Link,
} from "react-router";
import { AuthRoute } from "./pages/auth/routes";
import { AppContext, AppContextProvider } from "./context/app_context";
import Sidebar from "./components/sidebar";
import Navigation from "./components/navbar";
import { NotificationProvider } from "./context/notification_context";

// Pages are code-split so each role only downloads what it uses.

// ─── Auth ────────────────────────────────────────────────────
const Login = lazy(() => import("./pages/auth/login"));
const Register = lazy(() => import("./pages/auth/register"));
const Reset_password = lazy(() => import("./pages/auth/reset_password"));
const Email_verification = lazy(
  () => import("./pages/auth/email_verification"),
);

// ─── Admin ───────────────────────────────────────────────────
const AdminDashboard = lazy(() => import("./pages/admin/admin_dashboard"));
const AdminInventory = lazy(() => import("./pages/admin/admin_inventory"));
const StaffManagement = lazy(() => import("./pages/_shared/staff_management"));
const AdminOrderHistory = lazy(() => import("./pages/admin/admin_history"));

// ─── Manager ─────────────────────────────────────────────────
const ManagerDashboard = lazy(
  () => import("./pages/manager/manager_dashboard"),
);
const ManagerInventory = lazy(
  () => import("./pages/manager/manager_inventory"),
);
const ManagerOrderHistory = lazy(
  () => import("./pages/manager/manager_history"),
);

// ─── Employee ────────────────────────────────────────────────
const EmployeeOrderHistory = lazy(
  () => import("./pages/employee/order_history"),
);

// ─── Shared ──────────────────────────────────────────────────
const Pos = lazy(() => import("./pages/_shared/pos"));
const Profile = lazy(() => import("./pages/profile/desktop_profile"));

const EmployeeDashboard = lazy(() => import("./pages/employee/employee_dashboard"));
const TimeClock = lazy(() => import("./pages/_shared/time_clock"));
const SalesReport = lazy(() => import("./pages/_shared/sales_report"));
const StockAlerts = lazy(() => import("./pages/_shared/stock_alerts"));
const NotificationsPage = lazy(() => import("./pages/_shared/notifications"));
const ActivityLog = lazy(() => import("./pages/admin/activity_log"));
const CashDrawer = lazy(() => import("./pages/_shared/cash_drawer"));

const PageLoader = () => (
  <div className="h-screen flex items-center justify-center text-sm text-gray-400">
    Loading...
  </div>
);

// ─── Redirect ────────────────────────────────────────────────
const HomeRedirect = () => {
  const { isLoggedIn, loading } = useContext(AppContext);
  if (loading) return <PageLoader />;
  return <Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />;
};

const DashboardRedirect = () => {
  const { userData, loading } = useContext(AppContext);

  if (loading) return <PageLoader />;

  if (userData?.role === "admin")
    return <Navigate to="/admin/dashboard" replace />;
  if (userData?.role === "branch_manager")
    return <Navigate to="/branch_manager/dashboard" replace />;
  if (userData?.role === "employee")
    return <Navigate to="/employee/dashboard" replace />;

  return <Navigate to="/login" replace />;
};

// ─── Layouts ─────────────────────────────────────────────────
const Dashboard_layout = () => (
  <NotificationProvider>
  <div className="flex w-full min-h-screen font-inter overflow-x-hidden">
    <div className="hidden md:block z-100 print:hidden">
      <Sidebar />
    </div>
    {/* Only the top bar area — a full-screen wrapper here blocked taps. */}
    <div className="md:hidden fixed inset-x-0 top-0 z-50 print:hidden">
      <Navigation dashboard />
    </div>
    <div className="flex flex-col flex-1 min-w-0 pt-12 md:pt-0">
      <main className="flex-1 transition-all duration-300 md:ml-20 lg:ml-[280px]">
        <div className="min-h-full w-full bg-[#F3F3FF] md:rounded-tl-3xl relative overflow-hidden p-4">
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
              backgroundSize: "30px 30px",
            }}
          />
          <div className="relative z-10 max-w-[1500px] mx-auto w-full">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  </div>
  </NotificationProvider>
);

const Guest_layout = () => (
  <Suspense fallback={<PageLoader />}>
    <Outlet />
  </Suspense>
);

const Root = () => (
  <AppContextProvider>
    <Outlet />
  </AppContextProvider>
);

const Message_page = ({ icon, title, text }) => (
  <div className="h-screen flex flex-col items-center justify-center gap-4">
    <p className="text-5xl">{icon}</p>
    <p className="text-lg font-bold text-gray-800">{title}</p>
    <p className="text-sm text-gray-400">{text}</p>
    <Link to="/dashboard" className="text-sm text-indigo-600 hover:underline">
      Go back to dashboard
    </Link>
  </div>
);

// ─── Router ──────────────────────────────────────────────────
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Root />}>
      <Route index element={<HomeRedirect />} />

      {/* ─── Unauthorized ─── */}
      <Route
        path="unauthorized"
        element={
          <Message_page
            icon="🚫"
            title="Access Denied"
            text="You don't have permission to view this page."
          />
        }
      />

      {/* ─── Guest ─── */}
      <Route element={<AuthRoute requireAuth={false} />}>
        <Route element={<Guest_layout />}>
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
            <Route path="/admin/sales-report" element={<SalesReport />} />
            <Route path="/admin/cash-drawer" element={<CashDrawer />} />
            <Route path="/admin/activity" element={<ActivityLog />} />
            <Route path="/admin/notifications" element={<NotificationsPage />} />
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
            <Route
              path="/branch_manager/staff-management"
              element={<StaffManagement />}
            />
            <Route path="/branch_manager/pos" element={<Pos />} />
            <Route
              path="/branch_manager/history"
              element={<ManagerOrderHistory />}
            />
            <Route path="/branch_manager/sales-report" element={<SalesReport />} />
            <Route path="/branch_manager/cash-drawer" element={<CashDrawer />} />
            <Route path="/branch_manager/stock-alerts" element={<StockAlerts />} />
            <Route path="/branch_manager/time-clock" element={<TimeClock />} />
            <Route
              path="/branch_manager/notifications"
              element={<NotificationsPage />}
            />
          </Route>
        </Route>

        {/* ─── Employee ─── */}
        <Route
          element={<AuthRoute requireAuth={true} allowedRoles={["employee"]} />}
        >
          <Route element={<Dashboard_layout />}>
            <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
            {/* Cashier inventory was replaced by Stock Alerts */}
            <Route
              path="/employee/inventory"
              element={<Navigate to="/employee/stock-alerts" replace />}
            />
            <Route path="/employee/pos" element={<Pos />} />
            <Route
              path="/employee/history"
              element={<EmployeeOrderHistory />}
            />
            <Route path="/employee/sales-report" element={<SalesReport />} />
            <Route path="/employee/cash-drawer" element={<CashDrawer />} />
            <Route path="/employee/stock-alerts" element={<StockAlerts />} />
            <Route path="/employee/time-clock" element={<TimeClock />} />
            <Route path="/employee/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        {/* ─── Shared ─── */}
        <Route element={<Dashboard_layout />}>
          <Route path="profile" element={<Profile />} />
          <Route path="verify-account" element={<Email_verification />} />
        </Route>
      </Route>

      {/* ─── 404 ─── */}
      <Route
        path="*"
        element={
          <Message_page
            icon="🔍"
            title="Page not found"
            text="The page you're looking for doesn't exist."
          />
        }
      />
    </Route>,
  ),
);

export default function App() {
  return <RouterProvider router={router} />;
}
