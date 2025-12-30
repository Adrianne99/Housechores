import React, { useState, useContext, useEffect } from "react";
import { H2, H3, H5, H6, Paragraph } from "../../components/texts";
import { LuUserRound, LuMail, LuLock } from "react-icons/lu";
import { TextInput } from "../../components/input";
import { Button } from "../../components/buttons";
import { useNavigate } from "react-router";
import axios from "axios";
import { AppContext } from "../../context/app_context";
import logo from "../../assets/logo.png";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const { BACKEND_URL, setIsLoggedIn } = useContext(AppContext);

  const emailError =
    isSubmitted && !/\S+@\S+\.\S+/.test(email)
      ? "Please enter a valid email address."
      : "";
  const passwordError =
    isSubmitted && password.length < 8
      ? "Password must be at least 8 characters long."
      : "";

  const confirmPasswordError =
    confirmPassword && password !== confirmPassword
      ? "Passwords do not match."
      : "";

  const isFormValid =
    !!emailError ||
    !!passwordError ||
    !!confirmPasswordError ||
    !email ||
    !password ||
    !name;

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      setIsSubmitted(true);

      if (isFormValid) {
        return;
      }

      console.log(isFormValid);

      const { data } = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        name,
        email,
        password,
        confirmPassword,
      });

      if (data.success) {
        setIsLoggedIn(false);
        alert("Registration successful! Please login to continue.");
        navigate("/login");
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error(error);
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
        <img src={logo} alt="Logo" className="w-46 invert select-none" />
        <div className=" bg-white h-fit rounded-xl p-6 sm:p-15 w-[310px] sm:w-[450px]">
          <H2 className="mb-3 text-center">Create Account</H2>
          <Paragraph className="text-center mb-3">
            Create to your Account
          </Paragraph>
          <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
            <TextInput
              id="name"
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              showErrorText={true}
              required // Shows the * indicator
            />

            {/* Email Input with Real-time Validation */}
            <TextInput
              id="email"
              label="Email Address"
              type="email"
              placeholder="John.doe@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              showErrorText={true}
              required // Shows the * indicator
            />

            {/* Password Input with Validation and Helper Text */}
            <div className="relative">
              <TextInput
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={passwordError}
                showErrorText={true}
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

            <div className="relative">
              <TextInput
                id="password"
                label="Password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={confirmPasswordError}
                showErrorText={true}
                className="pr-12" // 👈 SPACE FOR THE EYE
                required
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-.5 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>

            <Button
              variant="primary"
              className="w-full rounded-full "
              disabled={isFormValid} // Button disabled if validation fails
            >
              Register
            </Button>
          </form>
          <Paragraph className="mt-4 text-center">
            Already have an account?{" "}
            <span
              className="text-indigo-600 font-semibold cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </Paragraph>
        </div>
      </div>
    </div>
  );
};

export default Register;
