import React, { useContext } from "react";
import { MoveLeft, UserPen, Camera } from "lucide-react";
import { H2, H3, H4, H6 } from "../../components/texts";
import { useNavigate } from "react-router";
import { AppContext } from "../../context/app_context";

const MobileProfile = () => {
  const navigate = useNavigate();

  const { userData } = useContext(AppContext);

  const SettingsArray = [{ item: "", link: "" }];

  return (
    <div className="p-4 space-y-4 md:hidden block">
      <div className="flex justify-between items-center">
        <div className="" onClick={() => navigate(-1)}>
          <MoveLeft />
        </div>
        <H4 className="text-black! font-inter">My Profile</H4>
        <div className="" onClick={() => navigate("/edit-profile")}>
          <UserPen />
        </div>
      </div>
      <div className="py-8 flex justify-center flex-col items-center space-y-4">
        <div className="relative">
          <div className="size-25 p-2 text-5xl text-white bg-linear-to-br from-primary via-second-gradient to-third-gradient text-center flex justify-center items-center rounded-full outline-2 outline-black">
            {userData?.name?.[0]?.toUpperCase()}
          </div>
          <div className="absolute right-0 top-3/4 -translate-y-1/4 bg-neutral-100 shadow-sm p-1 rounded-full">
            <Camera />
          </div>
        </div>
        <div className="text-center">
          <H3>{userData.name}</H3>
          <H6>@Adrianne99</H6>
        </div>
      </div>
    </div>
  );
};

export default MobileProfile;
