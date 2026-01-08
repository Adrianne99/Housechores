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
    /* The base background is light grey */
    <div className="flex w-full min-h-screen font-inter overflow-x-hidden">
      {/* Desktop Sidebar stays fixed on the left */}
      <div className="hidden md:block z-100">
        <Sidebar />
      </div>

      {/* Main Content Container */}
      <div className="flex flex-col flex-1 min-w-0">
        <main
          className="flex-1 transition-all duration-300
            md:ml-20 
            lg:ml-[280px] 
            "
        >
          <div className="min-h-full w-full bg-[#F3F3FF] md:rounded-tl-3xl border border-gray-200  relative overflow-hidden p-4 md:p-6 lg:p-8">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                size: "20px 20px",
                backgroundSize: "30px 30px",
              }}
            />

            <div className="relative z-10 max-w-[1500px] mx-auto w-full">
              {children}
              <Outlet />
              <Footer />
            </div>
          </div>
        </main>

        {/* Mobile Navigation remains at bottom */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <BottomNav />
        </div>
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
    <div className="bg-linear-to-br from-primary via-second-gradient to-third-gradient">
      <Register />
    </div>
  );
};

const Login_layout = () => {
  return (
    <div className="bg-linear-to-br from-primary via-second-gradient to-third-gradient">
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
