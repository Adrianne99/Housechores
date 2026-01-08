import React, { useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";

import { H2, Paragraph } from "@/components/texts";
import { TextInput } from "@/components/input";
import { Button } from "@/components/buttons";
import { AppContext } from "@/context/app_context";
import { cn } from "@/utils/utils";
import logo from "@/assets/logo.png";
import Toast from "@/components/toast";

// CRITICAL: Ensure all requests in this file include cookies
axios.defaults.withCredentials = true;

const Register = () => {
  const navigate = useNavigate();
  const { BACKEND_URL } = useContext(AppContext);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
    duration: 5000,
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [uiState, setUiState] = useState({
    isSubmitted: false,
    showPassword: false,
    showConfirmPassword: false,
    isChecked: false,
    isLoading: false, // Added loading state for better UX
  });

  const [serverError, setServerError] = useState("");

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (serverError) setServerError("");
  };

  const validation = useMemo(() => {
    const emailRegex = /\S+@\S+\.\S+/;
    const fullNameRegex = /^[A-Za-z]+(?:\s+[A-Za-z]+)+$/;

    const isFullnameValid = fullNameRegex.test(formData.name.trim());
    const isEmailValid = emailRegex.test(formData.email);
    const isPasswordValid = formData.password.length >= 8;
    const isMatching =
      formData.password === formData.confirmPassword &&
      formData.confirmPassword !== "";

    return {
      nameError:
        uiState.isSubmitted && !isFullnameValid
          ? "Please enter first and last name."
          : "",
      emailError:
        uiState.isSubmitted && !isEmailValid
          ? "Invalid email address."
          : serverError,
      passwordError:
        uiState.isSubmitted && !isPasswordValid ? "Must be 8+ characters." : "",
      confirmError:
        formData.confirmPassword && !isMatching
          ? "Passwords do not match."
          : "",
      isValid:
        isFullnameValid &&
        isEmailValid &&
        isPasswordValid &&
        isMatching &&
        uiState.isChecked,
    };
  }, [formData, uiState.isSubmitted, uiState.isChecked, serverError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUiState((p) => ({ ...p, isSubmitted: true }));

    if (!validation.isValid) return;

    setUiState((p) => ({ ...p, isLoading: true }));

    try {
      // 1. REGISTER - Must have withCredentials: true to receive the session cookie/token
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/register`,
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        },
        { withCredentials: true }
      );

      if (data.success) {
        setServerError("");
        showToast("Account created! Redirecting to Login", "success", 5000);

        setTimeout(() => {
          navigate("/login", {
            state: {
              email: formData.email,
              registrationSuccess: true,
            },
          });
        }, 5000);
      } else {
        setServerError(data.message);
      }
    } catch (error) {
      setServerError(
        error.response?.data?.message ||
          "An error occurred during registration."
      );
    } finally {
      setUiState((p) => ({ ...p, isLoading: false }));
    }
  };

  return (
    <div className="relative min- h-screen bg-background font-inter flex flex-col items-center justify-center p-4 overflow-hidden">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={5000}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-second-gradient/5 blur-[100px] pointer-events-none" />

      <button
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-10 flex items-  center gap-2 text-text-muted hover:text-primary transition-colors group"
      >
        <ArrowLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span className="font-medium">Back</span>
      </button>

      <div className="relative z-10 w-full max-w-md transition-all duration-300">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Logo" className="w-28 mb-4 object-contain" />
          <H2 className="text-text-main font-bold">Create Account</H2>
          <Paragraph className="text-text-muted text-center">
            Join us to start your journey
          </Paragraph>
        </div>

        <div className="bg-surface shadow-2xl border border-gray-100 rounded-xl p-6 md:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <TextInput
              id="name"
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleInputChange}
              error={validation.nameError}
              required
            />

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="absolute right-3 top-[38px] text-text-muted"
                >
                  {uiState.showPassword ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
              </div>

              <div className="relative">
                <TextInput
                  id="confirmPassword"
                  label="Confirm"
                  type={uiState.showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  error={validation.confirmError}
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setUiState((p) => ({
                      ...p,
                      showConfirmPassword: !p.showConfirmPassword,
                    }))
                  }
                  className="absolute right-3 top-[38px] text-text-muted"
                >
                  {uiState.showConfirmPassword ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="terms"
                className="size-4 mt-1 rounded border-gray-300 text-primary"
                checked={uiState.isChecked}
                onChange={(e) =>
                  setUiState((p) => ({ ...p, isChecked: e.target.checked }))
                }
              />
              <label
                htmlFor="terms"
                className="text-sm text-text-muted leading-tight"
              >
                I agree to the{" "}
                <span className="text-primary font-semibold">Terms</span> and{" "}
                <span className="text-primary font-semibold">
                  Privacy Policy
                </span>
                .
              </label>
            </div>

            <Button
              variant="primary"
              type="submit"
              className={cn(
                "w-full h-11 rounded-lg font-semibold transition-all",
                validation.isValid && !uiState.isLoading
                  ? "bg-primary text-white shadow-lg"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              )}
              disabled={!validation.isValid || uiState.isLoading}
            >
              {uiState.isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <Paragraph className="text-sm">
              Already have an account?{" "}
              <button
                className="text-primary font-bold hover:underline cursor-pointer"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
            </Paragraph>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
