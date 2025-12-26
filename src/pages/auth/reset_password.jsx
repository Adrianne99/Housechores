import React, { useRef, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { H3, Paragraph } from "../../components/texts";
import { Button } from "../../components/Buttons";
import { LuMail } from "react-icons/lu";
import { AppContext } from "../../context/app_context";
import useOtpInput from "../../hooks/use_otp_input";

const Reset_password = () => {
  axios.defaults.withCredentials = true;

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isEmailSent, setIsEmailSent] = useState("");
  const [otp, setOtp] = useState(0);
  const [isOtpSubmitted, setIsOtpSubmitted] = useState(false);

  const { BACKEND_URL, isLoggedIn, userData, getUserData } =
    useContext(AppContext);

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

      data.success ? console.log(data.message) : alert(data.message);
      data.success && setIsEmailSent(true);
    } catch (error) {
      console.log(error.message);
    }
  };

  const onSubmitOtp = async (e) => {
    e.preventDefault();

    // collect OTP
    const otpValue = inputRefs.current
      .map((input) => input.value || "")
      .join("");

    if (otpValue.length !== 6) {
      alert("OTP must be 6 digits");
      return;
    }

    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/verify-reset-otp`,
        { otp: otpValue }
      );

      if (!data.success) {
        alert(data.message || "Invalid OTP");
        return;
      }
      setOtp(otpValue);
      setIsOtpSubmitted(true);
      alert("OTP verified");
    } catch (error) {
      alert(error.response?.data?.message || error.message);
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
        ? alert(data.message)
        : alert(data.message, "Error resetting password");
      data.success && navigate("/login");
    } catch (error) {
      console.log(error.message);
      alert(error.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-blue-200 to-purple-400">
        {!isEmailSent && (
          <form
            onSubmit={onSubmitEmail}
            className="bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm"
          >
            <H3 className="text-white text-center font-bold font-inter">
              Reset Password
            </H3>
            <Paragraph
              variant="base"
              className="text-indigo-300 text-center mt-2"
            >
              Enter your Registered Email Address.
            </Paragraph>
            <div className="flex justify-between mb-8">
              <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333a5c] ">
                <LuMail className="text-white text-lg size-3" />
                <input
                  type="email"
                  placeholder="Email ID"
                  className="bg-transparent outline-none text-white"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
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
          <form
            // onSubmit={onSubmitHandler}
            onSubmit={onSubmitOtp}
            className="bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm"
          >
            <H3 className="text-white text-center font-bold font-inter">
              Email Verify OTP
            </H3>
            <Paragraph
              variant="base"
              className="text-indigo-300 text-center mt-2"
            >
              Enter the 6-digit code sent to your Email.
            </Paragraph>
            <div className="flex justify-between mb-8" onPaste={handlePaste}>
              {Array(6)
                .fill(0)
                .map((_, index) => {
                  return (
                    <input
                      type="number"
                      key={index}
                      maxLength={1}
                      ref={(e) => (inputRefs.current[index] = e)}
                      onInput={(e) => handleInput(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="size-12  text-white text-center border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  );
                })}
            </div>
            <Button size="lg" variant="primary">
              Submit
            </Button>
          </form>
        )}

        {/* NEW PASSWORD FORM */}

        {isOtpSubmitted && isEmailSent && (
          <form
            onSubmit={onSubmitNewPassword}
            className="bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm"
          >
            <H3 className="text-white text-center font-bold font-inter">
              Reset Password
            </H3>
            <Paragraph
              variant="base"
              className="text-indigo-300 text-center mt-2"
            >
              Enter your new Password
            </Paragraph>
            <div className="flex justify-between mb-8">
              <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333a5c] ">
                <LuMail className="text-white text-lg size-3" />
                <input
                  type="password"
                  placeholder="New Password"
                  className="bg-transparent outline-none text-white"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-between mb-8">
              <Button size="lg" variant="primary" className="w-full">
                Send OTP
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Reset_password;
