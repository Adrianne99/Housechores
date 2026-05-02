import React, { useContext } from "react";
import { AppContext } from "../context/app_context";
import { H3, H5, Paragraph } from "./texts";
import { Bell, Search } from "lucide-react";
import { TextInput } from "./input";

const Header = ({ title }) => {
  const { userData } = useContext(AppContext);

  const formatRole = (role) => {
    const map = {
      admin: "Admin",
      branch_manager: "Branch Manager",
      employee: "Employee",
    };
    return map[role] ?? "Loading...";
  };

  return (
    <div className="w-full flex justify-between items-center gap-6">
      <H3 className="whitespace-nowrap leading-tight">{title}</H3>
      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="relative w-full max-w-md">
          <TextInput
            className="bg-white text-sm w-full pl-10 h-10 mb-1 border-none shadow-sm rounded-lg"
            placeholder="Search"
          />
          <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </div>
        </div>

        <button className="bg-white shadow-sm size-10 flex items-center justify-center rounded-xl">
          <Bell size={20} color="#4239C4" />
        </button>
        <div className="flex justify-start items-center">
          <div className="size-10 bg-white shadow-sm rounded-xl"></div>
          <div className="text-black capitalize px-1 flex flex-col items-start justify-start">
            <H5>{userData?.name ?? `Loading...`}</H5>
            <Paragraph
              variant="muted"
              className="text-start text-primary font-medium"
            >
              {formatRole(userData?.role) ?? `Loading...`}
            </Paragraph>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
