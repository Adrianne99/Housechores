import React, { useContext, useEffect, useState } from "react";
import logo from "../assets/logo.png";
import { useNavigate, Link } from "react-router";
import { AppContext } from "../context/app_context";
import { LuX } from "react-icons/lu";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import axios from "axios";
import { H4, H5, H6 } from "./texts";
import { Button } from "./buttons.jsx";
import { Menu } from "lucide-react";
import { TextAlignEnd } from "lucide-react";

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

  const nav_items = [
    { item: "About", link: "/about" },
    { item: "Features", link: "/features" },
    { item: "Pricing", link: "/pricing" },
    { item: "Documentation", link: "/documentation" },
    { item: "Contact", link: "/contact" },
  ];

  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  return (
    <div className="w-full h-full max-w-[1440px] mx-auto">
      <div className="p-4 lg:p-6 flex justify-between items-center relative overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent pointer-events-none"></div>
        <img src={logo} className="w-16 lg:w-20" />

        <div className="bg-neutral-100/70 shadow-sm py-2.5 lg:py-3 px-8 hidden md:flex justify-center items-center gap-8 rounded-full z-50">
          {nav_items.map((index, i) => (
            <div className="" key={i}>
              <Link to={index.link}>
                <H6 className="hover:text-neutral-950">{index.item}</H6>
              </Link>
            </div>
          ))}
        </div>

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
              <div className="absolute hidden group-hover:block top-0 right-0 z-10 text-black rounded pt-10">
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
          <div className="flex justify-center items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
            <TextAlignEnd
              strokeWidth={1.5}
              className="block md:hidden"
              onClick={() => setOpen(!open)}
            />
          </div>
        )}
      </div>
      {open && (
        <div
          className="fixed inset-0 bg-black/80  z-40"
          onClick={() => setOpen(false)}
        />
      )}
      <div
        className={`fixed z-50 transition-transform w-full h-3/5 bottom-0 bg-neutral-100 rounded-t-4xl p-4 duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-1/2 h-3 rounded-full bg-neutral-200 mx-auto mb-8"></div>
        <div className="block space-y-2">
          <img src={logo} className="w-28 mx-auto" />
          <div>
            {nav_items.map((index, i) => (
              <div
                className={`border-b border-neutral-300 py-3`}
                key={i}
                onClick={() => setOpen(false)}
              >
                <Link to={index.link}>
                  <H6 className="hover:text-neutral-950 text-neutral-700 text-base!">
                    {index.item}
                  </H6>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
