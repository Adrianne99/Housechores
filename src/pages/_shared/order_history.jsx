import { useContext } from "react";
import { OrderHistoryTable } from "../../components/order_history_table";
import { AppContext } from "../../context/app_context";

// The server scopes orders by role; only the title differs.
const TITLES = {
  admin: "All Orders",
  branch_manager: "Branch Order History",
  employee: "My Order History",
};

export default function OrderHistory() {
  const { userData } = useContext(AppContext);
  return <OrderHistoryTable title={TITLES[userData?.role] ?? "Order History"} />;
}
