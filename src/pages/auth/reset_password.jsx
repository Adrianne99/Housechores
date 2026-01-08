import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { H2, Paragraph } from "@/components/texts";
import { Button } from "@/components/buttons";
import { TextInput } from "@/components/input";
import { AppContext } from "@/context/app_context";
import useOtpInput from "@/hooks/use_otp_input";
import Toast from "@/components/toast";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { cn } from "@/utils/utils";
import logo from "@/assets/logo.png";

const Reset_password = () => {
  axios.defaults.withCredentials = true;
  const navigate = useNavigate();
  const { BACKEND_URL } = useContext(AppContext);

  // States
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isOtpSubmitted, setIsOtpSubmitted] = useState(false);
  const [otp, setOtp] = useState("");

  const [uiState, setUiState] = useState({
    showPassword: false,
    isLoading: false,
  });

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const OTP_LENGTH = 6;
  const { inputRefs, handleInput, handleKeyDown, handlePaste } =
    useOtpInput(OTP_LENGTH);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  // STEP 1: Send OTP
  const onSubmitEmail = async (e) => {
    e.preventDefault();
    setUiState((p) => ({ ...p, isLoading: true }));
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/send-reset-otp`,
        { email }
      );
      if (!data.success) return showToast(data.message, "error");

      setIsEmailSent(true);
      showToast("OTP sent to your email!");
      sessionStorage.setItem("reset_email", email);
      sessionStorage.setItem("reset_step", "otp");
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong", "error");
    } finally {
      setUiState((p) => ({ ...p, isLoading: false }));
    }
  };

  // STEP 2: Verify OTP
  const onSubmitOtp = async (e) => {
    e.preventDefault();
    const otpValue = inputRefs.current.map((i) => i?.value || "").join("");
    if (otpValue.length !== 6)
      return showToast("OTP must be 6 digits", "warning");

    setUiState((p) => ({ ...p, isLoading: true }));
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/verify-reset-otp`,
        { otp: otpValue }
      );
      if (!data.success) return showToast(data.message, "error");

      setOtp(otpValue);
      setIsOtpSubmitted(true);
      showToast("OTP Verified!");
      sessionStorage.setItem("reset_otp", otpValue);
      sessionStorage.setItem("reset_step", "password");
    } catch (err) {
      showToast("Invalid OTP", "error");
    } finally {
      setUiState((p) => ({ ...p, isLoading: false }));
    }
  };

  // STEP 3: Reset Password
  const onSubmitNewPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8)
      return showToast("Min 8 characters required", "warning");

    if (newPassword !== confirmNewPassword) {
      return showToast("Password do not Match.", "warning");
    }

    setUiState((p) => ({ ...p, isLoading: true }));
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/reset-password`,
        {
          email,
          otp,
          new_password: newPassword,
        }
      );

      if (!data.success) return showToast(data.message, "error");
      showToast("Password updated! Redirecting to login...");
      sessionStorage.clear();
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      showToast("Failed to reset password", "error");
    } finally {
      setUiState((p) => ({ ...p, isLoading: false }));
    }
  };

  useEffect(() => {
    const step = sessionStorage.getItem("reset_step");
    if (sessionStorage.getItem("reset_email"))
      setEmail(sessionStorage.getItem("reset_email"));
    if (sessionStorage.getItem("reset_otp"))
      setOtp(sessionStorage.getItem("reset_otp"));
    if (step === "otp") setIsEmailSent(true);
    if (step === "password") {
      setIsEmailSent(true);
      setIsOtpSubmitted(true);
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-background font-inter flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Decorative Gradients (Matches Register/Login) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-second-gradient/40 blur-[120px] pointer-events-none" />

      {/* Back Button */}
      <button
        onClick={() => navigate("/login")}
        className="fixed top-6 left-6 z-10 flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft size={20} />{" "}
        <span className="font-medium">Back to Login</span>
      </button>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Logo" className="w-32 mb-4 object-contain" />
          <H2 className="text-text-main font-bold tracking-tight">
            Account Recovery
          </H2>
          <Paragraph className="text-text-muted text-center">
            Follow the steps to regain access
          </Paragraph>
        </div>

        {/* Card Layout */}
        <div className="bg-surface shadow-2xl border border-gray-100 rounded-xl p-6 md:p-8">
          {!isEmailSent && (
            <form
              onSubmit={onSubmitEmail}
              className="space-y-5 animate-in fade-in slide-in-from-bottom-2"
            >
              <TextInput
                label="Email Address"
                type="email"
                placeholder="Farazhaider@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button
                variant="primary"
                type="submit"
                className="w-full h-12 rounded-lg"
                disabled={uiState.isLoading}
              >
                {uiState.isLoading ? "Processing..." : "Send OTP"}
              </Button>
            </form>
          )}

          {isEmailSent && !isOtpSubmitted && (
            <form
              onSubmit={onSubmitOtp}
              className="space-y-6 animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {Array(OTP_LENGTH)
                  .fill(0)
                  .map((_, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      onInput={(e) => handleInput(e, i)}
                      onKeyDown={(e) => handleKeyDown(e, i)}
                      className="size-11 text-center font-bold border border-gray-200 rounded-lg focus:border-primary outline-none transition-all"
                    />
                  ))}
              </div>
              <Button
                variant="primary"
                type="submit"
                className="w-full h-12 rounded-lg"
                disabled={uiState.isLoading}
              >
                {uiState.isLoading ? "Verifying..." : "Verify Code"}
              </Button>
            </form>
          )}

          {isOtpSubmitted && (
            <form
              onSubmit={onSubmitNewPassword}
              className="space-y-5 animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="relative">
                <TextInput
                  label="New Password"
                  type={uiState.showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  label="Confirm new Password"
                  type={uiState.showPassword ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
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
              <Button
                variant="primary"
                type="submit"
                className="w-full h-12 rounded-lg"
                disabled={uiState.isLoading}
              >
                {uiState.isLoading ? "Updating..." : "Reset Password"}
              </Button>
            </form>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-text-muted/40">
          <ShieldCheck size={16} />
          <span className="text-xs font-medium uppercase tracking-widest">
            Security Verified
          </span>
        </div>
      </div>
    </div>
  );
};

export default Reset_password;
