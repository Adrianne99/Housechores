import { useState } from "react";
import reactLogo from "./assets/react.svg";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Outlet,
  Route,
  RouterProvider,
} from "react-router";
import Navbar from "./components/navbar";
import Header from "./components/header";
import Footer from "./components/footer";
import Hero from "./pages/hero";
import Register from "./pages/auth/register";
import Login from "./pages/auth/login";
import Email_verification from "./pages/auth/email_verification";
import Reset_password from "./pages/auth/reset_password";
import Dashboard from "./pages/dashboard/dashboard";
import ProtectedRoute from "./pages/auth/protected_route";

const App_layout = () => {
  return (
    <div className="w-full h-full bg-[#3FC7CF]/50">
      <Header />
      <div className="bg-white w-full h-full rounded-t-3xl">
        <div className="max-w-[1440px] mx-auto">
          <Navbar />
          <Outlet />
          <Footer />
        </div>
      </div>
    </div>
  );
};

const Dashboard_layout = () => {
  return (
    <div>
      <Navbar />
      <Dashboard />
      <Footer />
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

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard_layout />} />
      </Route>

      <Route path="/register" index element={<Register_layout />} />

      <Route path="/login" index element={<Login_layout />} />

      <Route path="/verify-account" element={<Email_verification />} />
      <Route path="/reset-password" element={<Reset_password />} />
    </>
  )
);

function App() {
  return (
    <div className="app">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
