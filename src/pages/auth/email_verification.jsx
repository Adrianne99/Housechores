import React, { useRef, useContext, useEffect } from "react";
import { H3, Paragraph } from "../../components/texts";
import { Button } from "../../components/Buttons";
import { AppContext } from "../../context/app_context";
import axios from "axios";
import { useNavigate } from "react-router";
import useOtpInput from "../../hooks/use_otp_input";

const Email_verification = () => {
  axios.defaults.withCredentials = true;
  const { BACKEND_URL, isLoggedIn, userData, getUserData } =
    useContext(AppContext);

  const OTP_LENGTH = 6;

  const navigate = useNavigate();

  const { inputRefs, handleInput, handleKeyDown, handlePaste } = useOtpInput(6);

  const onSubmitHandler = async (e) => {
    axios.defaults.withCredentials = true;
    try {
      e.preventDefault();

      const otp_array = inputRefs.current.map((e) => e?.value || "");
      const otp = otp_array.join("");
      const { data } = await axios.post(
        BACKEND_URL + "/api/auth/verify-account",
        { otp }
      );

      if (data.success) {
        alert(data.message);
        getUserData();
        navigate("/dashboard");
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    isLoggedIn && userData.is_account_verified && navigate("/dashboard");
  }, [isLoggedIn, userData]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-blue to purple-400">
      <div className="">
        <form
          onSubmit={onSubmitHandler}
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
                    required
                    ref={(e) => (inputRefs.current[index] = e)}
                    onInput={(e) => handleInput(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="size-12  text-white text-center border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                );
              })}
          </div>
          <Button size="lg" variant="primary">
            Verify Email
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Email_verification;
