import React, { useState, useContext } from "react";
import { H2, H3, H5, H6, Paragraph } from "../../components/texts";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/buttons";
import { TextInput } from "../../components/input";
import { useNavigate } from "react-router";
import { AppContext } from "../../context/app_context";
import axios from "axios";
import { cn } from "../../utils/utils";
import logo from "../../assets/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  const { BACKEND_URL, setIsLoggedIn, setUserData } = useContext(AppContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    if (isFormInvalid) {
      return;
    } else {
      setError("Your login credentials don't match an account in our system.");
    }

    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      if (!data.success) {
        return error;
      }
      setIsLoggedIn(true);
      setUserData(data.userData);

      navigate("/dashboard", { replace: true });
    } catch (err) {
      error("Unable to Login");
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
      <div className="w-full max-w-[1440px] flex-col flex justify-center items-center h-screen mx-auto relative">
        <img src={logo} alt="Logo" className="w-46 invert select-none mb-5" />
        <div className=" bg-white h-fit rounded-xl p-6 sm:p-15 w-[320px] sm:w-[450px] relative">
          <H2 className="mb-3 text-center">Login to your Account</H2>
          <Paragraph className="text-center mb-3">
            Login to your Account
          </Paragraph>
          {error && (
            <div
              className={cn(
                "text-red-500 absolute bg-white text-center px-4 py-6 w-3/4 top-10 drop-shadow-lg left-1/2 -translate-x-1/2",
                "before:absolute before:size-5 before:bg-white before:shadow-xs before:rotate-45 before:bottom-0 before:translate-y-2.5 before:left-1/2 before:-translate-x-1/2"
              )}
            >
              {error}
            </div>
          )}
          <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
            <TextInput
              id="email"
              label="Email Address"
              type="email"
              placeholder="John.doe@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              showErrorText={false}
              required
            />

            <div className="relative">
              <TextInput
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error}
                showErrorText={false}
                className="pr-12" // 👈 SPACE FOR THE EYE
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
    </div>
  );
};

export default Login;
