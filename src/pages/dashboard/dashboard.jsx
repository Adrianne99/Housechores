import { useContext } from "react";
import { AppContext } from "../../context/app_context";
import { TextInput } from "../../components/input";
import { H1, H2, H3, H4, H5, H6, Paragraph } from "../../components/texts";
import { Bell, Search, User } from "lucide-react";
import { ChartCard, DashboardCard, StocksCard } from "../../components/card";

const Dashboard = () => {
  const { userData } = useContext(AppContext);

  const isAdmin = userData?.role === "admin";

  // const getFirstNames = (fullName = "") => {
  //   const parts = fullName.trim().split(" ");
  //   if (parts.length <= 1) return fullName;
  //   return parts.slice(0, -1).join(" ");
  // };

  // const capitalize = (string) =>
  //   string.replace(/\b\w/g, (a) => a.toUpperCase());

  return (
    <div className="relative w-full space-y-12 pt-3">
      <div className="w-full flex justify-between items-center gap-6">
        {/* Left Side: Title and Welcome */}
        <div className="flex justify-center items-center gap-4">
          <H3 className="whitespace-nowrap leading-tight">Dashboard</H3>
        </div>
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
              <H5>{userData ? userData?.name : `Loading...`}</H5>
              <Paragraph
                variant="muted"
                className="text-start text-primary font-medium"
              >
                {userData ? userData?.role : `Loading...`}
              </Paragraph>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {isAdmin ? (
          <>
            <DashboardCard sign="₱" title="Total Sales" />
            <DashboardCard sign="₱" title="Online Orders" />
            <DashboardCard sign="₱" title="Invoices" />
            <DashboardCard sign="" title="Products Sold" />
            <div className="col-span-3 row-span-3">
              <ChartCard />
            </div>
            <div className="col-span-1 row-span-3">
              <div className="bg-white w-full h-full p-6 rounded-xl shadow-sm border border-gray-100">
                <H6 className="mb-4">Recent Activity</H6>
                {/* You can put a list of transactions or low stock alerts here */}
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 italic">
                    No pending syncs...
                  </p>
                </div>
              </div>
            </div>
            <StocksCard />
          </>
        ) : (
          <>
            <DashboardCard sign="₱" title="Total Sales" />
            <DashboardCard sign="" title="Current Stock" />
            <DashboardCard sign="" title="Invoices" />
            <DashboardCard sign="" title="Products Sold" />
            <div className="col-span-3 row-span-3">
              <ChartCard />
            </div>
            <div className="col-span-1 row-span-3">
              <div className="bg-white w-full h-full p-6 rounded-xl shadow-sm border border-gray-100">
                <H6 className="mb-4">Recent Activity</H6>
                {/* You can put a list of transactions or low stock alerts here */}
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 italic">
                    No pending syncs...
                  </p>
                </div>
              </div>
            </div>
            <div className="col-span-4">
              <StocksCard />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
