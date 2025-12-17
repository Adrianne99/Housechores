import React, { useState, useContext } from "react";
import { H2, H3, H6, Paragraph } from "../../components/texts";
import { LuUserRound, LuMail, LuLock } from "react-icons/lu";
import { Button } from "../../components/Buttons";
import { TextInput } from "../../components/input";
import { useNavigate } from "react-router";
import { AppContext } from "../../context/app_context";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const emailError =
    isSubmitted && !/\S+@\S+\.\S+/.test(email)
      ? "Please enter a valid email address."
      : "";
  const passwordError =
    isSubmitted && password.length < 8
      ? "Password must be at least 8 characters long."
      : "";
  const isFormInvalid = !!emailError || !!passwordError || !email || !password;

  const navigate = useNavigate();

  const { BACKEND_URL, setIsLoggedIn, getUserData, setUserData } =
    useContext(AppContext);

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();

      axios.defaults.withCredentials = true;

      setIsSubmitted(true);
      const { data } = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email,
        password,
      });

      if (data.success) {
        setIsLoggedIn(true);
        navigate("/dashboard");
        getUserData();
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <div className="w-full max-w-[1440px] flex justify-center items-center h-screen mx-auto">
      <div className=" bg-white h-fit rounded-xl p-10 sm:w-98">
        <H2 className="mb-3 text-center">Login to your Account</H2>
        <Paragraph className="text-center mb-3">
          Login to your Account
        </Paragraph>
        <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
          <TextInput
            id="email"
            label="Email Address"
            type="email"
            placeholder="John.doe@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            required
          />

          <TextInput
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required // Shows the * indicator
          />

          <Paragraph
            onClick={() => navigate("/reset-password")}
            className="text-indigo-600 hover:text-indigo-800 transition duration-150 cursor-pointer text-sm font-medium  text-right"
          >
            Forgot Password?
          </Paragraph>

          <Button
            variant="primary"
            className="w-full rounded-full"
            disabled={isFormInvalid} // Button disabled if validation fails
          >
            Login
          </Button>
        </form>
        <Paragraph className="mt-4 text-center">
          Don't have an account?{" "}
          <span
            className="text-indigo-600 font-semibold cursor-pointer"
            onClick={() => navigate("/register")}
          >
            Register
          </span>
        </Paragraph>
      </div>
    </div>
  );
};

export default Login;
