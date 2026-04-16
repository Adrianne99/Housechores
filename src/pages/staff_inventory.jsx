import Header from "../components/header";
import { DashboardCard, StocksCard } from "../components/card";
import { H6 } from "../components/texts";

const StaffInventory = () => {
  return (
    <div className="relative w-full space-y-12 pt-3">
      <Header title="Inventory Management" />
      <div className="grid grid-cols-4 gap-2">
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
            <div className="space-y-4">
              <p className="text-xs text-gray-500 italic">
                No pending syncs...
              </p>
            </div>
          </div>
        </div>
        <div className="col-span-4">
          <StocksCard title="Stocks" />
        </div>
      </div>
    </div>
  );
};

export default StaffInventory;
