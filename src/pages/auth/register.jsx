import React, { useState, useContext, useEffect } from "react";
import { H2, H3, H6, Paragraph } from "../../components/texts";
import { LuUserRound, LuMail, LuLock } from "react-icons/lu";
import { TextInput } from "../../components/input";
import { Button } from "../../components/buttons";
import { useNavigate } from "react-router";
import axios from "axios";
import { AppContext } from "../../context/app_context";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

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
    <div className="w-full max-w-[1440px] flex justify-center items-center h-screen mx-auto">
      <div className=" bg-white h-fit rounded-xl p-10 sm:w-98">
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
            required // Shows the * indicator
          />

          {/* Email Input with Real-time Validation */}
          <TextInput
            id="email"
            label="Email Address or Username"
            type="email"
            placeholder="John.doe@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            required // Shows the * indicator
          />

          {/* Password Input with Validation and Helper Text */}
          <TextInput
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            required // Shows the * indicator
          />

          <TextInput
            id="confirm_password"
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            error={confirmPasswordError}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required // Shows the * indicator
          />

          <Button
            variant="primary"
            className="w-full rounded-full"
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
  );
};

export default Register;
