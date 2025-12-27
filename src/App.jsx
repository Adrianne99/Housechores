import { Suspense, lazy } from "react";
import Sidebar from "./components/sidebar";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Outlet,
  Route,
  RouterProvider,
} from "react-router";
import AuthRoute from "./pages/auth/routes";
import SavingsTracker from "./pages/dashboard/savings_tracker";
import BottomNav from "./components/bottom_nav";
import { useIsMobile } from "./hooks/use_is_mobile";

const Navbar = lazy(() => import("./components/navbar"));
const Footer = lazy(() => import("./components/footer"));
const Hero = lazy(() => import("./pages/hero"));
const Register = lazy(() => import("./pages/auth/register"));
const Login = lazy(() => import("./pages/auth/login"));
const Email_verification = lazy(() =>
  import("./pages/auth/email_verification")
);
const Reset_password = lazy(() => import("./pages/auth/reset_password"));
const Dashboard = lazy(() => import("./pages/dashboard/dashboard"));
const BudgetPlanner = lazy(() => import("./pages/dashboard/budget_planner"));
const CalorieCounter = lazy(() => import("./pages/dashboard/calorie_counter"));
const Documentation = lazy(() => import("./pages/dashboard/documentation"));
const MobileProfile = lazy(() => import("./pages/profile/mobile_profile"));
const DesktopProfile = lazy(() => import("./pages/profile/desktop_profile"));
const Edit_profile = lazy(() => import("./pages/profile/edit_profile"));
const Todo = lazy(() => import("./pages/dashboard/todo"));

const App_layout = () => {
  return (
    <div className="w-full h-full">
      <div className="bg-white w-full h-fit relative">
        <Navbar />
        <Outlet />
        <Footer />
      </div>
    </div>
  );
};

const Dashboard_layout = ({ children }) => {
  return (
    <div className="flex w-full bg-[#DBDFE6] min-h-screen relative">
      <div className="hidden md:grid grid-cols-[280px_1fr]">
        <Sidebar />
        <main className="min-h-screen md:ml-[220px] lg:ml-[280px] w-full">
          {children}
          <Outlet />
          <Footer />
        </main>
      </div>

      <div className="md:hidden w-full">
        <BottomNav />
        <main className="min-h-screen">
          {children}
          <Outlet />
          <Footer />
        </main>
      </div>
    </div>
  );
};

const ProfileGate = () => {
  const isMobile = useIsMobile();

  return isMobile ? (
    <MobileProfile />
  ) : (
    <div>
      <Dashboard_layout>
        <DesktopProfile />
      </Dashboard_layout>
    </div>
  );
};

const Register_layout = () => {
  return (
    <div className="bg-[#9FE2E7]">
      <Register />
    </div>
  );
};

const Login_layout = () => {
  return (
    <div className="bg-[#9FE2E7]">
      <Login />
    </div>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route>
        <Route path="/" element={<App_layout />}>
          <Route index element={<Hero />} />
        </Route>
      </Route>

      <Route element={<AuthRoute requireAuth={true} />}>
        <Route path="/profile" element={<ProfileGate />} />

        <Route element={<Dashboard_layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/budget-planner" element={<BudgetPlanner />} />
          <Route path="/todo-app" element={<Todo />} />
          <Route path="/calorie-counter" element={<CalorieCounter />} />
          <Route path="/edit-profile" element={<Edit_profile />} />
          <Route path="/savings-tracker" element={<SavingsTracker />} />
          <Route path="/documentation" element={<Documentation />} />
        </Route>
        <Route path="/profile" element={<MobileProfile />} />
        <Route path="/verify-account" element={<Email_verification />} />
      </Route>

      <Route element={<AuthRoute requireAuth={false} />}>
        <Route path="/register" index element={<Register_layout />} />
        <Route path="/login" index element={<Login_layout />} />
        <Route path="/reset-password" element={<Reset_password />} />
      </Route>
    </>
  )
);

function App() {
  return (
    <div className="app">
      <Suspense fallback={<div>Loading Page....</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </div>
  );
}

export default App;
