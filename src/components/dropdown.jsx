import { useState, useEffect, useRef, useContext } from "react";
import { Store, Plus, Trash2, X, Check } from "lucide-react";
import { Button } from "./buttons";
import { AppContext } from "../context/app_context"; // ← import your context
import axios from "axios";

export const BranchDropdown = ({ onBranchSelect }) => {
  const { userData } = useContext(AppContext); // ← get role
  const can_edit_all = ["admin"].includes(userData?.role);

  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setAdding(false);
        setError(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) fetch_branches();
  }, [open]);

  const fetch_branches = async () => {
    try {
      const { data } = await axios.get("/api/branches");
      if (data.success) setBranches(data.branches);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async () => {
    if (!form.name.trim()) {
      setError("Branch name is required.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("/api/branches", form);
      if (!data.success) throw new Error(data.message);
      setBranches((prev) => [...prev, data.branch]);
      setForm({ name: "", address: "" });
      setAdding(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      const { data } = await axios.delete(`/api/branches/${id}`);
      if (!data.success) throw new Error(data.message);
      setBranches((prev) => prev.filter((b) => b._id !== id));
      if (selected?._id === id) {
        setSelected(null);
        onBranchSelect?.(null);
      }
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
    }
  };

  const handleSelect = (branch) => {
    setSelected(branch);
    onBranchSelect?.(branch);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelected(null);
    onBranchSelect?.(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="secondary"
        size="md"
        className="w-fit gap-2"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Store
          size={16}
          className={selected ? "text-indigo-600" : "text-gray-600"}
        />
        <span className={selected ? "text-indigo-600 font-medium" : ""}>
          {selected ? selected.name : "All Branches"}
        </span>
        {selected && (
          <X
            size={13}
            className="text-gray-400 hover:text-gray-600"
            onClick={handleClear}
          />
        )}
      </Button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Branches
            </p>
            {/* Add button — owner/admin only */}
            {can_edit_all && (
              <button
                onClick={() => {
                  setAdding((p) => !p);
                  setError(null);
                }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <Plus size={14} />
              </button>
            )}
          </div>

          {/* Add form — owner/admin only */}
          {adding && can_edit_all && (
            <div className="px-3 py-2.5 border-b border-gray-100 flex flex-col gap-2">
              <input
                autoFocus
                placeholder="Branch name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") setAdding(false);
                }}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
              />
              <input
                placeholder="Address (optional)"
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
              />
              {error && <p className="text-xs text-red-500">⚠ {error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAdding(false);
                    setError(null);
                  }}
                  className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={loading}
                  className="flex-1 py-1.5 text-xs bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto py-1">
            <button
              onClick={() => {
                setSelected(null);
                onBranchSelect?.(null);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                !selected
                  ? "text-indigo-600 font-medium bg-indigo-50"
                  : "text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Store size={14} />
                All Branches
              </div>
              {!selected && <Check size={13} className="text-indigo-500" />}
            </button>

            {branches.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4 italic">
                No branches yet
              </p>
            ) : (
              branches.map((branch) => (
                <button
                  key={branch._id}
                  onClick={() => handleSelect(branch)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-gray-50 group ${
                    selected?._id === branch._id
                      ? "text-indigo-600 font-medium bg-indigo-50"
                      : "text-gray-700"
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span>{branch.name}</span>
                    {branch.address && (
                      <span className="text-xs text-gray-400">
                        {branch.address}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {selected?._id === branch._id && (
                      <Check size={13} className="text-indigo-500" />
                    )}
                    {/* Delete — owner/admin only */}
                    {can_edit_all && (
                      <span
                        onClick={(e) => handleDelete(branch._id, e)}
                        className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={12} />
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
