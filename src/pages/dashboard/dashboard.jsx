import { useContext } from "react";
import { AppContext } from "../../context/app_context";

const Dashboard = () => {
  const { userData } = useContext(AppContext);

  return (
    <div className="relative">
      Dashboard
      <div className="">
        {userData ? `Welcome, ${userData.name}` : "Loading user data..."}
      </div>
    </div>
  );
};

export default Dashboard;
