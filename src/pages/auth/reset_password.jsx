import React, { useRef, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { H2, H3, H4, H5, Paragraph } from "../../components/texts";
import { Button } from "../../components/buttons";

import { AppContext } from "../../context/app_context";
import useOtpInput from "../../hooks/use_otp_input";
import logo from "../../assets/logo.png";
import { TextInput } from "../../components/input";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { cn } from "../../utils/utils";

const Reset_password = () => {
  axios.defaults.withCredentials = true;

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isEmailSent, setIsEmailSent] = useState("");
  const [otp, setOtp] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [password, setPassword] = useState("");
  const [isOtpSubmitted, setIsOtpSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { BACKEND_URL } = useContext(AppContext);

  const OTP_LENGTH = 6;
  const { inputRefs, handleInput, handleKeyDown, handlePaste } =
    useOtpInput(OTP_LENGTH);

  const onSubmitEmail = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/send-reset-otp`,
        { email },
        { withCredentials: false }
      );

      data.success ? setSuccess(data.message) : setError(data.message);
      data.success && setIsEmailSent(true);
    } catch (error) {
      console.log(error.message);
    }
  };

  const onSubmitOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const otpValue = inputRefs.current
      .map((input) => input.value || "")
      .join("");

    if (otpValue.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/verify-reset-otp`,
        { otp: otpValue }
      );

      if (!data.success) {
        setError(data.message || "Invalid OTP");
        return;
      }
      setOtp(otpValue);
      setIsOtpSubmitted(true);
      setSuccess("OTP verified successfully");
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    }
  };
  const onSubmitNewPassword = async (e) => {
    e.preventDefault();

    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/reset-password`,
        { email, otp, new_password: newPassword }
      );

      data.success
        ? setSuccess(data.message)
        : setError(data.message, "Error resetting password");
      data.success && navigate("/login");
    } catch (error) {
      console.log(error.message);
      setError(error.message);
    }
  };

  return (
    <div className="relative">
      <div
        className="absolute cursor-pointer text-white flex justify-center items-center gap-2 top-4 left-4"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={25} strokeWidth={1.5} />
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-primary via-second-gradient to-third-gradient">
        <img src={logo} alt="Logo" className="w-46 invert select-none mb-5" />
        {!isEmailSent && (
          <form
            onSubmit={onSubmitEmail}
            className="bg-white rounded-xl shadow-lg p-6 sm:p-15 w-[320px] sm:w-[450px] text-sm"
          >
            <H2 className="mb-2 text-center">Reset Password</H2>
            <Paragraph className="text-center mb-6">
              Enter your Registered Email Address.
            </Paragraph>
            <div className="flex justify-between mb-4 w-full">
              <TextInput
                id="email"
                label="Email Address"
                type="email"
                placeholder="John.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                showErrorText={false}
                required
              />
            </div>
            <div className="flex justify-between mb-8">
              <Button size="lg" variant="primary" className="w-full">
                Send OTP
              </Button>
            </div>
          </form>
        )}
        {/* OTP FORM */}
        {!isOtpSubmitted && isEmailSent && (
          <div className="relative flex flex-col justify-center items-center">
            <form
              onSubmit={onSubmitOtp}
              className="bg-white rounded-xl shadow-lg p-6 sm:p-15 w-[320px] sm:w-[450px] text-sm relative"
            >
              <H2 className="text-black text-center font-bold font-inter">
                Email Verify OTP
              </H2>
              <Paragraph variant="base" className="text-center mt-2">
                Enter the 6-digit code sent to your Email.
              </Paragraph>
              <div className="flex justify-between mb-6" onPaste={handlePaste}>
                {Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <input
                      key={index}
                      type="number"
                      maxLength={1}
                      ref={(e) => (inputRefs.current[index] = e)}
                      onInput={(e) => {
                        setError("");
                        setSuccess("");
                        handleInput(e, index);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className={cn(
                        "size-12 text-black text-center border rounded-md focus:outline-none focus:ring-2 transition-colors",
                        error
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-600 focus:ring-indigo-500"
                      )}
                    />
                  ))}
              </div>
              {success && (
                <p className="text-green-600 text-center mb-6">{success}</p>
              )}

              {error && (
                <p className="text-red-600 text-center mb-6">{error}</p>
              )}
              <Button size="lg" variant="primary">
                Submit
              </Button>
            </form>
          </div>
        )}
        {/* NEW PASSWORD FORM */}
        {isOtpSubmitted && isEmailSent && (
          <form
            onSubmit={onSubmitNewPassword}
            className="bg-white rounded-xl shadow-lg p-6 sm:p-15 w-[320px] sm:w-[450px] text-sm"
          >
            <H2 className="text-black text-center font-bold font-inter">
              Enter your new password
            </H2>
            <Paragraph className="text-center mt-2">
              Enter your new Password
            </Paragraph>
            <div className="relative mb-4">
              <TextInput
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error}
                showErrorText={true}
                className="pr-12"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-.5 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            <div className="flex justify-between mb-6">
              <Button size="lg" variant="primary" className="w-full">
                Submit
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Reset_password;
