import { useContext } from "react";
import { AppContext } from "../../context/app_context";
import { H6 } from "../../components/texts";
import { ChartCard, DashboardCard, StocksCard } from "../../components/card";
import Header from "../../components/header";
import { useAdmin } from "../../hooks/use_admin";

const ADMIN_CARDS = [
  { sign: "₱", title: "Total Sales", value: "250,000" },
  { sign: "", title: "Invoices / Receipts", value: "125" },
  { sign: "", title: "Products Sold", value: "300" },
];

const USER_CARDS = [
  { sign: "₱", title: "Total Sales", value: "250,000" },
  { sign: "", title: "Current Stock", value: "250,000" },
  { sign: "", title: "Invoices", value: "250,000" },
  { sign: "", title: "Products Sold", value: "250,000" },
];

const LAYOUT_PRESETS = {
  2: {
    grid: "grid-cols-2",
    chart: "col-span-1",
    activity: "col-span-1",
    stocks: "col-span-2",
  },
  3: {
    grid: "grid-cols-3",
    chart: "col-span-2",
    activity: "col-span-1",
    stocks: "col-span-3",
  },
  4: {
    grid: "grid-cols-4",
    chart: "col-span-3",
    activity: "col-span-1",
    stocks: "col-span-4",
  },
};

const Dashboard = ({ cols = 4 }) => {
  const { userData } = useContext(AppContext);
  const { isAdmin } = useAdmin();

  const cards = isAdmin ? ADMIN_CARDS : USER_CARDS;
  const layout = LAYOUT_PRESETS[cols] ?? LAYOUT_PRESETS[4];

  return (
    <div className="relative w-full space-y-12 pt-3">
      <Header title="Dashboard" />
      <div className={`grid ${layout.grid} gap-2`}>
        {cards.map(({ sign, title, value }) => (
          <DashboardCard key={title} sign={sign} title={title} value={value} />
        ))}
        <div className={`${layout.activity} row-span-4`}>
          <div className="bg-white w-full h-full p-6 rounded-xl shadow-sm border border-gray-100">
            <H6 className="mb-4">Recent Activity</H6>
            <div className="space-y-4">
              <p className="text-xs text-gray-500 italic">
                No pending syncs...
              </p>
            </div>
          </div>
        </div>

        <div className={`${layout.chart} row-span-3`}>
          <ChartCard />
        </div>

        <div className={isAdmin ? "col-span-4" : layout.stocks}>
          {/* <StocksCard /> */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
