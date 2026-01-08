import { useContext } from "react";
import { AppContext } from "../../context/app_context";

const Dashboard = () => {
  const { userData } = useContext(AppContext);

  const getFirstNames = (fullName = "") => {
    const parts = fullName.trim().split(" ");
    if (parts.length <= 1) return fullName;
    return parts.slice(0, -1).join(" ");
  };

  const capitalize = (string) =>
    string.replace(/\b\w/g, (a) => a.toUpperCase());

  return (
    <div className="relative  bg-">
      Dashboard
      <div className="">
        {userData
          ? `Welcome, ${capitalize(getFirstNames(userData.name))}`
          : "Loading user data..."}
      </div>
    </div>
  );
};

export default Dashboard;
