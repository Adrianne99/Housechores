import React, { useContext } from "react";
import { MoveLeft, UserPen, Camera } from "lucide-react";
import { H2, H3, H4, H6 } from "../../components/texts";
import { Link, useNavigate } from "react-router";
import { AppContext } from "../../context/app_context";
import { History, Bug, Save, ArrowLeftToLine } from "lucide-react";
import axios from "axios";

const MobileProfile = () => {
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

  const SettingsArray = [
    { item: "Saved Items", link: "", icon: Save },
    { item: "History", link: "", icon: History },
    { item: "Report Bug", link: "", icon: Bug },
    { item: "Logout", icon: ArrowLeftToLine, onClick: logout, color: "red" },
  ];

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
      <div className="">
        {SettingsArray.map((index) => (
          <div className="border-b border-neutral-300 py-3" key={index.item}>
            <Link
              to={index.link}
              className="flex justify-start items-center"
              onClick={index.onClick}
            >
              <index.icon strokeWidth={1.5} color={index.color || "gray"} />
              <H6 className={`hover:text-neutral-950  text-base! px-2`}>
                {index.item}
              </H6>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileProfile;
