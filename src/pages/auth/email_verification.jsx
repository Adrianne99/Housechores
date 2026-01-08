import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { H2, Paragraph } from "../../components/texts";
import { Button } from "../../components/buttons";
import { AppContext } from "../../context/app_context";
import useOtpInput from "../../hooks/use_otp_input";
import Toast from "../../components/toast";
import logo from "../../assets/logo.png";
import { ShieldCheck } from "lucide-react";

const Email_verification = () => {
  axios.defaults.withCredentials = true;
  const { BACKEND_URL, isLoggedIn, userData, getUserData } =
    useContext(AppContext);
  const navigate = useNavigate();

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [isLoading, setIsLoading] = useState(false);

  const OTP_LENGTH = 6;
  const { inputRefs, handleInput, handleKeyDown, handlePaste } =
    useOtpInput(OTP_LENGTH);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const otp_array = inputRefs.current.map((e) => e?.value || "");
      const otp = otp_array.join("");

      if (otp.length < OTP_LENGTH) {
        showToast("Please enter the full code", "warning");
        setIsLoading(false);
        return;
      }

      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/verify-account`,
        { otp }
      );

      if (data.success) {
        showToast("Email verified successfully!");
        getUserData();
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        showToast(data.message, "error");
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || "Verification failed",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && userData?.is_account_verified) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, userData, navigate]);

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

      {/* Decorative Gradients (Matches Login/Register) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-second-gradient/40 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo Section */}
        <img src={logo} alt="Logo" className="w-32 mb-8 object-contain" />

        <div className="w-full bg-surface shadow-2xl border border-gray-100 rounded-xl p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <H2 className="text-center mb-2">Verify your Email</H2>
          <Paragraph
            variant="base"
            className="text-center text-text-muted mb-8"
          >
            Enter the 6-digit code sent to your email address.
          </Paragraph>

          <form onSubmit={onSubmitHandler} className="space-y-8">
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {Array(OTP_LENGTH)
                .fill(0)
                .map((_, index) => (
                  <input
                    type="text"
                    key={index}
                    maxLength={1}
                    required
                    ref={(e) => (inputRefs.current[index] = e)}
                    onInput={(e) => handleInput(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="size-11 md:size-12 text-center text-lg font-bold border border-neutral-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                  />
                ))}
            </div>

            <Button
              variant="primary"
              className="w-full h-12 rounded-lg font-semibold text-white shadow-lg shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Paragraph variant="small" className="text-text-muted">
              Didn't receive a code?{" "}
              <button
                type="button"
                className="text-primary font-bold hover:underline"
                onClick={() =>
                  showToast("A new code has been sent!", "success")
                }
              >
                Resend OTP
              </button>
            </Paragraph>
          </div>
        </div>

        {/* Secure Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-text-muted/40">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Identity Protection
          </span>
        </div>
      </div>
    </div>
  );
};

export default Email_verification;
