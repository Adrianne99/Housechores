import React, { useContext } from "react";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router";
import { AppContext } from "../context/app_context";
import { LuX } from "react-icons/lu";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import axios from "axios";

const Navbar = () => {
  const navigate = useNavigate();

  const { userData, BACKEND_URL, setIsLoggedIn, setUserData } =
    useContext(AppContext);

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.get(`${BACKEND_URL}/api/auth/logout`);

      if (data.success) {
        setIsLoggedIn(false);
        setUserData(null);
        navigate("/", { replace: true });
      }

      console.log("Logged out successfulley");
    } catch (error) {
      console.log(error.message);
    }
  };

  const send_verification_otp = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(
        BACKEND_URL + "/api/auth/send-verification-otp"
      );

      if (data.success) {
        navigate("/verify-account");
        alert(data.message);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div className="w-full h-full">
      <div className="p-4 flex justify-between items-center">
        <img src={logo} className="w-28" />

        {userData ? (
          <div className="relative flex justify-center items-center">
            {/* <h1>Hey,{userData.name}</h1> */}
            <div className="bg-blue-500 relative group text-xl rounded-full size-10 flex justify-center items-center text-white font-bold cursor-pointer">
              {userData.is_account_verified ? (
                <div className="absolute bottom-0 right-0 bg-green-400 rounded-full">
                  <RiVerifiedBadgeFill />
                </div>
              ) : (
                <div className="absolute bottom-0 right-0 bg-red-400 rounded-full">
                  <LuX />
                </div>
              )}
              {userData?.name?.[0]?.toUpperCase()}
              {/* hidden */}
              <div className="absolute group-hover:block top-0 right-0 z-10 text-black rounded pt-10">
                <ul>
                  {!userData.is_account_verified && (
                    <li
                      className="py-1 px-2 hover:bg-gray-200 cursor-pointer"
                      onClick={send_verification_otp}
                    >
                      Verify Email
                    </li>
                  )}
                  <li
                    className="py-1 px-2 hover:bg-gray-200 cursor-pointer"
                    onClick={logout}
                  >
                    Logout
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="" onClick={() => navigate("/login")}>
            Login
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
