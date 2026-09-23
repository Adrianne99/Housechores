import { useContext } from "react";
import { Store } from "lucide-react";
import { AppContext } from "../context/app_context";

// ─── BranchLabel ────────────────────────────────────────────────
// Static read-only badge showing the user's assigned branch.
// For manager/employee — they see WHICH branch they're working in
// but can't switch.
//
// Reads from userData.branch which is populated by the backend
// (login + is-auth + get_user_data all return userData.branch as
// { _id, name, address } via Mongoose .populate()).
export const BranchLabel = () => {
  const { userData } = useContext(AppContext);
  const branch = userData?.branch;

  if (!branch) return null;

  // Defensive: branch could be populated (object) or just an id (string)
  // If it's just a string id, we don't have a name to show — bail.
  const name = typeof branch === "object" ? branch.name : null;
  if (!name) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-sm font-medium text-indigo-700">
      <Store size={14} />
      <span>{name} Branch</span>
    </div>
  );
};
