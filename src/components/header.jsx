import React from "react";
import { FaInstagram } from "react-icons/fa";
import { FaXTwitter, FaFacebookF } from "react-icons/fa6";
import { FaMoon } from "react-icons/fa";

const Header = () => {
  return (
    <div className="max-w-[1440px] mx-auto flex justify-between items-center font-inter">
      <div className="py-4 relative flex justify-between items-center text-black w-full">
        <h1>Housechores Platform is now Live!</h1>
        <div className="">
          <FaMoon />
        </div>
      </div>
    </div>
  );
};

export default Header;
