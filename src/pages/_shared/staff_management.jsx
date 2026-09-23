import { useContext, useEffect, useState } from "react";
import { Plus, Pencil, UserX, UserCheck, Trash2 } from "lucide-react";
import axios from "axios";

import Header from "../../components/header";
import { Button } from "../../components/buttons";
import { AppContext } from "../../context/app_context";
import { Add_Staff_Modal } from "../../components/_modal/add_staff"; // adjust paths
import { Edit_Staff_Modal } from "../../components/_modal/edit_staff"; // adjust paths
import {
  Deactivate_Staff_Modal,
  Reactivate_Staff_Modal,
  Delete_Staff_Modal,
} from "../../components/_modal/confirm";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function StaffPage() {
  const { userData } = useContext(AppContext);
  const isAdmin = ["admin", "owner"].includes(userData?.role);

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [reactivateTarget, setReactivateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const triggerRefresh = () => setRefresh((p) => p + 1);

  // Fetch staff list
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BACKEND_URL}/api/staff`)
      .then(({ data }) => {
        if (data.success) setStaff(data.staff);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refresh]);

  return (
    <div className="relative w-full space-y-12 pt-3">
      <Header title="Staff Management" />

      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          All Staff ({staff.length})
        </h2>
        <Button variant="primary" size="md" onClick={() => setShowAdd(true)}>
          <Plus size={16} />
          <span>Add Staff</span>
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Hourly Rate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Loading staff...
                </td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No staff yet.
                </td>
              </tr>
            ) : (
              staff.map((s) => (
                <tr
                  key={s._id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.email}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">
                    {s.role.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.branch?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 tabular-nums">
                    {s.hourly_rate > 0
                      ? `₱${Number(s.hourly_rate).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        s.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditTarget(s)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      {s.is_active ? (
                        <button
                          onClick={() => setDeactivateTarget(s)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-orange-600"
                          title="Deactivate"
                        >
                          <UserX size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setReactivateTarget(s)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-green-600"
                          title="Reactivate"
                        >
                          <UserCheck size={14} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <Add_Staff_Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={triggerRefresh}
      />

      <Edit_Staff_Modal
        open={!!editTarget}
        staff={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={triggerRefresh}
      />

      <Deactivate_Staff_Modal
        open={!!deactivateTarget}
        staff={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onSuccess={triggerRefresh}
      />

      <Reactivate_Staff_Modal
        open={!!reactivateTarget}
        staff={reactivateTarget}
        onClose={() => setReactivateTarget(null)}
        onSuccess={triggerRefresh}
      />

      <Delete_Staff_Modal
        open={!!deleteTarget}
        staff={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={triggerRefresh}
      />
    </div>
  );
}
