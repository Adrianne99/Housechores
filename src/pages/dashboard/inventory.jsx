import { AdminInventory } from "../admin_inventory";
import StaffInventory from "../staff_inventory";
import { useAdmin } from "../../hooks/use_admin";

const Inventory = () => {
  const { isAdmin } = useAdmin();
  return isAdmin ? <AdminInventory /> : <StaffInventory />;
};

export default Inventory;
