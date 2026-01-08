import React, { useState, useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";

import { H2, Paragraph } from "@/components/texts";
import { TextInput } from "@/components/input";
import { Button } from "@/components/buttons";
import { AppContext } from "@/context/app_context";
import { cn } from "@/utils/utils";
import logo from "@/assets/logo.png";
import Toast from "@/components/Toast"; // Import your new Toast

// Ensure credentials for session handling
axios.defaults.withCredentials = true;

const Login = () => {
  const navigate = useNavigate();
  const { BACKEND_URL, setIsLoggedIn, setUserData } = useContext(AppContext);

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [uiState, setUiState] = useState({
    isSubmitted: false,
    showPassword: false,
    isLoading: false,
  });

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  // Validation Logic
  const validation = useMemo(() => {
    const emailRegex = /\S+@\S+\.\S+/;
    const isEmailValid = emailRegex.test(formData.email);
    const isPasswordValid = formData.password.length >= 8;

    return {
      emailError:
        uiState.isSubmitted && !isEmailValid
          ? "Please enter a valid email."
          : "",
      passwordError:
        uiState.isSubmitted && !isPasswordValid
          ? "Password must be at least 8 characters."
          : "",
      isValid: isEmailValid && isPasswordValid,
    };
  }, [formData, uiState.isSubmitted]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUiState((p) => ({ ...p, isSubmitted: true }));

    if (!validation.isValid) return;

    setUiState((p) => ({ ...p, isLoading: true }));

    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: formData.email,
        password: formData.password,
      });

      if (data.success) {
        setIsLoggedIn(true);
        setUserData(data.userData);
        showToast("Login successful! Redirecting...");

        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1500);
      } else {
        showToast(data.message, "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Invalid credentials", "error");
    } finally {
      setUiState((p) => ({ ...p, isLoading: false }));
    }
  };

  return (
    <div className="relative min-h-screen bg-background font-inter flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={5000}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Background decoration (Matches Register) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-second-gradient/40 blur-[120px] pointer-events-none" />

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-10 flex items-center gap-2 text-text-muted hover:text-primary transition-colors group"
      >
        <ArrowLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span className="font-medium">Back</span>
      </button>

      <div className="relative z-10 w-full max-w-md transition-all duration-300">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Logo" className="w-32 mb-4 object-contain" />
          <H2 className="text-text-main font-bold tracking-tight">
            Welcome Back
          </H2>
          <Paragraph className="text-text-muted text-center">
            Login to access your dashboard
          </Paragraph>
        </div>

        {/* Card (Matches Register Style) */}
        <div className="bg-surface shadow-2xl border border-gray-100 rounded-xl p-6 md:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <TextInput
              id="email"
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleInputChange}
              error={validation.emailError}
              required
            />

            <div className="relative">
              <TextInput
                id="password"
                label="Password"
                type={uiState.showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                error={validation.passwordError}
                required
              />
              <button
                type="button"
                onClick={() =>
                  setUiState((p) => ({ ...p, showPassword: !p.showPassword }))
                }
                className="absolute right-3 top-[38px] text-text-muted hover:text-primary"
              >
                {uiState.showPassword ? (
                  <Eye size={18} />
                ) : (
                  <EyeOff size={18} />
                )}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/reset-password")}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              variant="primary"
              type="submit"
              className={cn(
                "w-full h-12 rounded-lg font-semibold text-white transition-all active:scale-[0.98]",
                validation.isValid && !uiState.isLoading
                  ? "bg-primary shadow-lg shadow-primary/20"
                  : "bg-disabled opacity-70 cursor-not-allowed"
              )}
              disabled={!validation.isValid || uiState.isLoading}
            >
              {uiState.isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Paragraph className="text-sm">
              Don't have an account?{" "}
              <button
                className="text-primary font-bold hover:underline"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
            </Paragraph>
          </div>
        </div>

        {/* Secure Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-text-muted/40">
          <ShieldCheck size={16} />
          <span className="text-xs font-medium uppercase tracking-widest">
            Secure Authentication
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
