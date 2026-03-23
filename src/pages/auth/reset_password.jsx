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
import { Countdown } from "@/components/timer";

const Reset_password = () => {
  axios.defaults.withCredentials = true;
  const navigate = useNavigate();
  const { BACKEND_URL } = useContext(AppContext);

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isOtpSubmitted, setIsOtpSubmitted] = useState(false);
  const [otp, setOtp] = useState("");
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [lastSentTime, setLastSentTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const COOLDOWN_TIME = 60000;

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

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const step = sessionStorage.getItem("reset_step");
    const savedEmail = sessionStorage.getItem("reset_email");
    const savedOtp = sessionStorage.getItem("reset_otp");
    const savedTime = sessionStorage.getItem("last_otp_time");

    if (savedEmail) setEmail(savedEmail);
    if (savedOtp) setOtp(savedOtp);
    if (savedTime) setLastSentTime(parseInt(savedTime));

    if (step === "otp") setIsEmailSent(true);
    if (step === "password") {
      setIsEmailSent(true);
      setIsOtpSubmitted(true);
    }
  }, []);

  const handleRateLimit = () => {
    const timePassed = Date.now() - lastSentTime;
    if (timePassed < COOLDOWN_TIME) {
      const remaining = Math.ceil((COOLDOWN_TIME - timePassed) / 1000);
      showToast(
        `Please wait ${remaining}s before requesting a new code.`,
        "warning"
      );
      return false;
    }
    return true;
  };

  const onSubmitEmail = async (e) => {
    e.preventDefault();
    if (!handleRateLimit()) return;

    setUiState((p) => ({ ...p, isLoading: true }));
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/send-reset-otp`,
        { email }
      );
      if (!data.success) return showToast(data.message, "error");

      const now = Date.now();
      setLastSentTime(now);
      sessionStorage.setItem("last_otp_time", now.toString());

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

  const resendOtp = async () => {
    if (isTimerActive || !handleRateLimit()) return;

    setUiState((p) => ({ ...p, isLoading: true }));
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/send-reset-otp`,
        { email }
      );
      if (!data.success) return showToast(data.message, "error");

      const endTime = Date.now() + 300000;
      sessionStorage.setItem("otp_expiry_time", endTime.toString());

      const now = Date.now();
      setLastSentTime(now);
      sessionStorage.setItem("last_otp_time", now.toString());

      setIsTimerActive(true);
      showToast("OTP Resent!");
    } catch (err) {
      showToast("Failed to resend", "error");
    } finally {
      setUiState((p) => ({ ...p, isLoading: false }));
    }
  };

  const handleGoBackToEmail = () => {
    setIsEmailSent(false);
    sessionStorage.removeItem("reset_step");
  };

  const onSubmitNewPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8)
      return showToast("Min 8 characters required", "warning");
    if (newPassword !== confirmNewPassword)
      return showToast("Passwords do not match", "warning");

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
      showToast("Password updated! Redirecting...");
      sessionStorage.clear();
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      showToast("Failed to reset password", "error");
    } finally {
      setUiState((p) => ({ ...p, isLoading: false }));
    }
  };

  const isLocked = currentTime - lastSentTime < COOLDOWN_TIME;
  const remainingSeconds = Math.ceil(
    (COOLDOWN_TIME - (currentTime - lastSentTime)) / 1000
  );

  return (
    <div className="relative min-h-screen bg-background font-inter flex flex-col items-center justify-center p-4 overflow-hidden">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-second-gradient/40 blur-[120px] pointer-events-none" />
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

        <div className="bg-surface shadow-2xl border border-gray-100 rounded-xl p-6 md:p-8">
          {!isEmailSent && (
            <form
              onSubmit={onSubmitEmail}
              className="space-y-5 animate-in fade-in slide-in-from-bottom-2"
            >
              <TextInput
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button
                variant="primary"
                type="submit"
                className="w-full h-12 rounded-lg"
                disabled={uiState.isLoading || isLocked}
              >
                {uiState.isLoading
                  ? "Processing..."
                  : isLocked
                  ? `Wait ${remainingSeconds}s`
                  : "Send OTP"}
              </Button>
            </form>
          )}

          {isEmailSent && !isOtpSubmitted && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-center">
                <Paragraph className="text-sm text-text-muted">
                  Sent to{" "}
                  <span className="font-bold text-text-main">{email}</span>
                </Paragraph>
                <button
                  onClick={handleGoBackToEmail}
                  className="text-xs text-primary hover:underline font-medium mt-1"
                >
                  Change email?
                </button>
              </div>
              <form onSubmit={onSubmitOtp} className="space-y-6">
                <div
                  className="flex justify-between gap-2"
                  onPaste={handlePaste}
                >
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
                <div className="text-sm">
                  <span
                    className={cn(
                      "inline-flex font-medium transition-all",
                      isTimerActive || isLocked
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer text-primary hover:underline"
                    )}
                    onClick={resendOtp}
                  >
                    {isTimerActive ? "Resend in " : "Resend code"}
                    <Countdown onComplete={() => setIsTimerActive(false)} />
                  </span>
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
            </div>
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
                  label="Confirm Password"
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
