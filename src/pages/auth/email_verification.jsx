import React, { useRef, useContext, useEffect } from "react";
import { H3, Paragraph } from "../../components/texts";
import { Button } from "../../components/Buttons";
import { AppContext } from "../../context/app_context";
import axios from "axios";
import { useNavigate } from "react-router";

const Email_verification = () => {
  axios.defaults.withCredentials = true;
  const { BACKEND_URL, isLoggedIn, userData, getUserData } =
    useContext(AppContext);
  const input_refs = useRef([]);
  const navigate = useNavigate();

  const handleInput = (e, index) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 1);

    if (e.target.value.length > 0 && index < input_refs.current.length - 1) {
      input_refs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && e.target.value.length === 0 && index > 0) {
      input_refs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text");
    const pasteArray = paste.split("");
    pasteArray.forEach((char, index) => {
      if (input_refs.current[index]) {
        input_refs.current[index].value = char;
      }

      if (paste.length && input_refs.current[index + 1]) {
        input_refs.current[index].focus();
      }
    });
  };

  const onSubmitHandler = async (e) => {
    axios.defaults.withCredentials = true;

    try {
      e.preventDefault();

      const otp_array = input_refs.current.map((e) => e?.value || "");
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
    isLoggedIn && userData?.verified && navigate("/dashboard");
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
                    ref={(e) => (input_refs.current[index] = e)}
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
