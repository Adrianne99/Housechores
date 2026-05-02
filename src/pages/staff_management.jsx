import { useContext, useEffect, useState } from "react";
import Header from "../components/header";
import { Button } from "../components/buttons";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { AppContext } from "../context/app_context";
import axios from "axios";

const ROLES = ["admin", "branch_manager", "employee"];

const ROLE_BADGE = {
  admin: "bg-indigo-100 text-indigo-700",
  branch_manager: "bg-purple-100 text-purple-700",
  employee: "bg-gray-100 text-gray-600",
};

const RoleBadge = ({ role }) => (
  <span
    className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_BADGE[role] ?? "bg-gray-100 text-gray-500"}`}
  >
    {role?.replace("_", " ")}
  </span>
);

const HOURS = Array.from(
  { length: 24 },
  (_, i) => `${String(i).padStart(2, "0")}:00`,
);

// ── Shift Block (draggable) ────────────────────────────────────
const ShiftBlock = ({ shift, onDelete }) => (
  <div className="bg-indigo-100 border border-indigo-200 rounded-lg px-2 py-1 flex items-center justify-between gap-1 group">
    <div>
      <p className="text-xs font-semibold text-indigo-700">
        {shift.employee?.name}
      </p>
      <p className="text-xs text-indigo-400">
        {shift.start_time} – {shift.end_time}
      </p>
    </div>
    <button
      onClick={() => onDelete(shift._id)}
      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded text-red-400 transition-all"
    >
      <X size={10} />
    </button>
  </div>
);

// ── Add Shift Modal ────────────────────────────────────────────
const AddShiftModal = ({ open, onClose, onSuccess, date, branches, staff }) => {
  const [form, setForm] = useState({
    employee: "",
    branch: "",
    start_time: "08:00",
    end_time: "17:00",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm({
      employee: "",
      branch: "",
      start_time: "08:00",
      end_time: "17:00",
    });
    setError(null);
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.employee || !form.branch)
      return setError("Employee and branch are required.");
    setLoading(true);
    try {
      const { data } = await axios.post("/api/schedule", { ...form, date });
      if (!data.success) throw new Error(data.message);
      onSuccess(data.shift);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-gray-900">Add Shift</p>
            <p className="text-xs text-gray-400">{date}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Employee *
            </label>
            <select
              value={form.employee}
              onChange={(e) =>
                setForm((p) => ({ ...p, employee: e.target.value }))
              }
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="">Select employee</option>
              {staff
                .filter((s) => s.role !== "admin")
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.role.replace("_", " ")})
                  </option>
                ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Branch *
            </label>
            <select
              value={form.branch}
              onChange={(e) =>
                setForm((p) => ({ ...p, branch: e.target.value }))
              }
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Start Time *
              </label>
              <select
                value={form.start_time}
                onChange={(e) =>
                  setForm((p) => ({ ...p, start_time: e.target.value }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                End Time *
              </label>
              <select
                value={form.end_time}
                onChange={(e) =>
                  setForm((p) => ({ ...p, end_time: e.target.value }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              ⚠ {error}
            </p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <Button
            variant="secondary"
            size="md"
            className="w-full!"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            className="w-full!"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Add Shift"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Manual Log Modal ───────────────────────────────────────────
const ManualLogModal = ({ open, onClose, onSuccess, staff }) => {
  const [form, setForm] = useState({
    employee: "",
    date: "",
    clock_in: "",
    clock_out: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm({ employee: "", date: "", clock_in: "", clock_out: "", notes: "" });
    setError(null);
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.employee || !form.date || !form.clock_in || !form.clock_out)
      return setError("All fields are required.");
    setLoading(true);
    try {
      const { data } = await axios.post("/api/timelogs/manual", {
        ...form,
        clock_in: `${form.date}T${form.clock_in}:00`,
        clock_out: `${form.date}T${form.clock_out}:00`,
      });
      if (!data.success) throw new Error(data.message);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-gray-900">Manual Time Log</p>
            <p className="text-xs text-gray-400">Log hours for an employee</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Employee *
            </label>
            <select
              value={form.employee}
              onChange={(e) =>
                setForm((p) => ({ ...p, employee: e.target.value }))
              }
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="">Select employee</option>
              {staff
                .filter((s) => s.role !== "admin")
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Date *
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Clock In *
              </label>
              <input
                type="time"
                value={form.clock_in}
                onChange={(e) =>
                  setForm((p) => ({ ...p, clock_in: e.target.value }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Clock Out *
              </label>
              <input
                type="time"
                value={form.clock_out}
                onChange={(e) =>
                  setForm((p) => ({ ...p, clock_out: e.target.value }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Notes
            </label>
            <input
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Optional notes"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              ⚠ {error}
            </p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <Button
            variant="secondary"
            size="md"
            className="w-full!"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            className="w-full!"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Log"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Staff Modal (unchanged) ────────────────────────────────────
const StaffModal = ({ open, onClose, onSuccess, editing }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    branch: "",
    hourly_rate: 0,
  });
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("/api/branches").then(({ data }) => {
      if (data.success) setBranches(data.branches);
    });
  }, []);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        email: editing.email,
        password: "",
        role: editing.role,
        branch: editing.branch?._id ?? "",
        hourly_rate: editing.hourly_rate ?? 0,
      });
    } else {
      setForm({
        name: "",
        email: "",
        password: "",
        role: "employee",
        branch: "",
        hourly_rate: 0,
      });
    }
    setError(null);
  }, [editing, open]);

  if (!open) return null;

  const needs_branch = ["branch_manager", "employee"].includes(form.role);

  const handleSubmit = async () => {
    if (!form.name || !form.email || (!editing && !form.password) || !form.role)
      return setError("All required fields must be filled.");
    if (needs_branch && !form.branch)
      return setError("Branch is required for this role.");
    setLoading(true);
    try {
      if (editing) {
        const { data } = await axios.put(`/api/user/staff/${editing._id}`, {
          role: form.role,
          branch: form.branch || null,
          hourly_rate: Number(form.hourly_rate),
        });
        if (!data.success) throw new Error(data.message);
      } else {
        const { data } = await axios.post("/api/user/staff", {
          ...form,
          hourly_rate: Number(form.hourly_rate),
        });
        if (!data.success) throw new Error(data.message);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-gray-900">
              {editing ? "Edit Staff" : "Add Staff"}
            </p>
            <p className="text-xs text-gray-400">
              {editing
                ? "Update role, branch or hourly rate"
                : "Create a new staff account"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          {!editing && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Juan Dela Cruz"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="e.g. juan@email.com"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Password *
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="Min. 8 characters"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Role *
            </label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm((p) => ({ ...p, role: e.target.value, branch: "" }))
              }
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          {needs_branch && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Branch *
              </label>
              <select
                value={form.branch}
                onChange={(e) =>
                  setForm((p) => ({ ...p, branch: e.target.value }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="">Select a branch</option>
                {/* branches fetched inside StaffModal */}
                {[].map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Hourly Rate (₱)
            </label>
            <input
              type="number"
              value={form.hourly_rate}
              onChange={(e) =>
                setForm((p) => ({ ...p, hourly_rate: e.target.value }))
              }
              placeholder="e.g. 65"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              ⚠ {error}
            </p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <Button
            variant="secondary"
            size="md"
            className="w-full!"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            className="w-full!"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : editing ? "Save Changes" : "Add Staff"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ open, staff, onClose, onConfirm }) => {
  if (!open || !staff) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl">
            <Trash2 size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              Delete {staff.name}?
            </p>
            <p className="text-xs text-gray-400">This cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="md"
            className="w-full!"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            className="w-full!"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Scheduler Tab ──────────────────────────────────────────────
const SchedulerTab = ({ staff, branches }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState({});
  const [loading, setLoading] = useState(false);
  const [dragEmpId, setDragEmpId] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dateKey = (year, month, day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const COLORS = [
    { bg: "#EEEDFE", text: "#3C3489", dot: "#534AB7" },
    { bg: "#E1F5EE", text: "#085041", dot: "#0F6E56" },
    { bg: "#FAECE7", text: "#712B13", dot: "#993C1D" },
    { bg: "#FBEAF0", text: "#72243E", dot: "#993556" },
    { bg: "#E6F1FB", text: "#0C447C", dot: "#185FA5" },
    { bg: "#EAF3DE", text: "#27500A", dot: "#3B6D11" },
    { bg: "#FAEEDA", text: "#633806", dot: "#854F0B" },
  ];

  const empColor = (empId) => {
    const idx = staff.findIndex((s) => s._id === empId);
    return COLORS[idx % COLORS.length];
  };

  const fetch_shifts = async () => {
    setLoading(true);
    try {
      const start = dateKey(y, m, 1);
      const end = dateKey(y, m, new Date(y, m + 1, 0).getDate());
      const { data } = await axios.get(
        `/api/schedule?start=${start}&end=${end}`,
      );
      if (data.success) {
        // Group shifts by date
        const grouped = {};
        data.shifts.forEach((shift) => {
          if (!grouped[shift.date]) grouped[shift.date] = [];
          grouped[shift.date].push(shift);
        });
        setShifts(grouped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch_shifts();
  }, [y, m]);

  const handleDrop = async (key) => {
    if (!dragEmpId) return;
    const emp = staff.find((s) => s._id === dragEmpId);
    if (!emp) return;

    // Check already scheduled
    const existing = shifts[key] ?? [];
    if (existing.find((s) => (s.employee?._id ?? s.employee) === dragEmpId))
      return;

    try {
      const { data } = await axios.post("/api/schedule", {
        employee: dragEmpId,
        branch: emp.branch?._id ?? emp.branch,
        date: key,
        start_time: "08:00",
        end_time: "17:00",
      });
      if (data.success) {
        setShifts((prev) => ({
          ...prev,
          [key]: [...(prev[key] ?? []), data.shift],
        }));
      }
    } catch (err) {
      console.error(err);
    }
    setDragOver(null);
  };

  const handleDeleteShift = async (shiftId, key) => {
    try {
      await axios.delete(`/api/schedule/${shiftId}`);
      setShifts((prev) => ({
        ...prev,
        [key]: (prev[key] ?? []).filter((s) => s._id !== shiftId),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // Build calendar cells
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daysInPrevMonth = new Date(y, m, 0).getDate();
  const today = new Date();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({
      day: daysInPrevMonth - i,
      month: m - 1,
      year: y,
      other: true,
    });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, month: m, year: y, other: false });
  while (cells.length < 42)
    cells.push({
      day: cells.length - firstDay - daysInMonth + 1,
      month: m + 1,
      year: y,
      other: true,
    });

  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="flex gap-4 h-[620px]">
      {/* Employee Roster */}
      <div className="w-48 shrink-0 flex flex-col border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-3 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Employees
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
          {staff
            .filter((s) => s.role !== "admin")
            .map((emp, idx) => {
              const c = COLORS[idx % COLORS.length];
              return (
                <div
                  key={emp._id}
                  draggable
                  onDragStart={() => setDragEmpId(emp._id)}
                  onDragEnd={() => setDragEmpId(null)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 cursor-grab active:cursor-grabbing hover:bg-gray-50 transition-colors select-none"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{ background: c.bg, color: c.text }}
                  >
                    {getInitials(emp.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {emp.name.split(" ")[0]}
                    </p>
                    <p className="text-xs text-gray-400">
                      {emp.role.replace("_", " ")}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 flex flex-col border border-gray-100 rounded-xl overflow-hidden min-w-0">
        {/* Nav */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">
            {MONTHS[m]} {y}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(new Date(y, m - 1, 1))}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(y, m + 1, 1))}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider border-r border-gray-100 last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div
          className="flex-1 overflow-y-auto grid grid-cols-7"
          style={{ alignContent: "start" }}
        >
          {cells.map((cell, i) => {
            const key = dateKey(cell.year, cell.month, cell.day);
            const isToday =
              !cell.other &&
              cell.day === today.getDate() &&
              cell.month === today.getMonth() &&
              cell.year === today.getFullYear();
            const cellShifts = shifts[key] ?? [];
            const isOver = dragOver === key;

            return (
              <div
                key={i}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(key);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(key)}
                className={`min-h-20 border-r border-b border-gray-100 last:border-r-0 p-1.5 flex flex-col gap-1 transition-colors ${
                  isOver ? "bg-indigo-50" : "hover:bg-gray-50/50"
                }`}
              >
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? "bg-indigo-500" : ""
                  }`}
                >
                  <span
                    className={`text-xs font-medium ${
                      isToday
                        ? "text-white"
                        : cell.other
                          ? "text-gray-300"
                          : "text-gray-700"
                    }`}
                  >
                    {cell.day}
                  </span>
                </div>
                {cellShifts.map((shift) => {
                  const empId = shift.employee?._id ?? shift.employee;
                  const empIdx = staff.findIndex((s) => s._id === empId);
                  const c = COLORS[empIdx % COLORS.length];
                  const empName =
                    shift.employee?.name ??
                    staff.find((s) => s._id === empId)?.name ??
                    "?";
                  return (
                    <div
                      key={shift._id}
                      className="flex items-center justify-between rounded px-1.5 py-0.5 text-xs font-medium group"
                      style={{ background: c.bg, color: c.text }}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="truncate leading-tight">
                          {empName.split(" ")[0]}
                        </span>
                        <span
                          className="text-xs opacity-70 leading-tight"
                          style={{ fontSize: "9px" }}
                        >
                          {shift.start_time} – {shift.end_time}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteShift(shift._id, key)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-red-500"
                        style={{ color: c.text }}
                      >
                        <X size={9} />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-3 flex-wrap">
          {staff
            .filter((s) => s.role !== "admin")
            .map((emp, idx) => {
              const c = COLORS[idx % COLORS.length];
              return (
                <div key={emp._id} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: c.dot }}
                  />
                  <span className="text-xs text-gray-500">
                    {emp.name.split(" ")[0]}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

// ── Time Logs Tab ──────────────────────────────────────────────
const TimeLogsTab = ({ staff }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [manualModal, setManualModal] = useState(false);

  const fetch_logs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterEmployee) params.append("employee_id", filterEmployee);
      if (filterDate) params.append("date", filterDate);
      const { data } = await axios.get(`/api/timelogs?${params}`);
      if (data.success) setLogs(data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch_logs();
  }, [filterEmployee, filterDate]);

  const total_salary = logs.reduce(
    (sum, l) => sum + (l.computed_salary ?? 0),
    0,
  );
  const total_hours = logs.reduce((sum, l) => sum + (l.hours_worked ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Filters + Manual Log */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            <option value="">All Employees</option>
            {staff
              .filter((s) => s.role !== "admin")
              .map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
          />
          {(filterEmployee || filterDate) && (
            <button
              onClick={() => {
                setFilterEmployee("");
                setFilterDate("");
              }}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
        <Button
          variant="secondary"
          size="md"
          className="w-fit gap-2"
          onClick={() => setManualModal(true)}
        >
          <Plus size={14} /> Manual Log
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Logs", value: logs.length },
          { label: "Total Hours", value: `${total_hours.toFixed(1)} hrs` },
          {
            label: "Total Salary",
            value: `₱${total_salary.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-gray-50 rounded-xl p-4 border border-gray-100"
          >
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              {label}
            </p>
            <p className="text-lg font-bold text-gray-800 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {[
                "Employee",
                "Date",
                "Clock In",
                "Clock Out",
                "Hours",
                "Rate",
                "Salary",
                "Type",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : logs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                          {log.employee?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">
                          {log.employee?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{log.date}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {log.clock_in
                        ? new Date(log.clock_in).toLocaleTimeString("en-PH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {log.clock_out ? (
                        new Date(log.clock_out).toLocaleTimeString("en-PH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ) : (
                        <span className="text-amber-500 font-medium text-xs">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {log.hours_worked?.toFixed(2) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      ₱{log.hourly_rate}
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-600">
                      ₱{log.computed_salary?.toFixed(2) ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.is_manual ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}
                      >
                        {log.is_manual ? "Manual" : "Auto"}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && logs.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">🕐</p>
            <p className="text-sm">No time logs found</p>
          </div>
        )}
      </div>

      <ManualLogModal
        open={manualModal}
        onClose={() => setManualModal(false)}
        onSuccess={fetch_logs}
        staff={staff}
      />
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────
export const StaffManagement = () => {
  const { userData } = useContext(AppContext);
  const [tab, setTab] = useState("staff");
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetch_staff = async () => {
    setLoading(true);
    try {
      const [staff_res, branch_res] = await Promise.all([
        axios.get("/api/user/staff"),
        axios.get("/api/branches"),
      ]);
      if (staff_res.data.success) setStaff(staff_res.data.staff);
      if (branch_res.data.success) setBranches(branch_res.data.branches);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch_staff();
  }, []);

  const handleDelete = async () => {
    try {
      const { data } = await axios.delete(`/api/user/staff/${deleting._id}`);
      if (!data.success) throw new Error(data.message);
      setDeleting(null);
      fetch_staff();
    } catch (err) {
      console.error(err);
    }
  };

  const TABS = [
    { id: "staff", label: "Staff", icon: Users },
    { id: "scheduler", label: "Scheduler", icon: Calendar },
    { id: "timelogs", label: "Time Logs", icon: Clock },
  ];

  return (
    <div className="relative w-full space-y-6 pt-3">
      <Header title="Staff Management" />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm p-1.5 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? "bg-indigo-500 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Staff Tab */}
        {tab === "staff" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-bold text-gray-900">All Staff</p>
                <p className="text-xs text-gray-400">
                  {staff.length} member{staff.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                className="w-fit gap-2"
                onClick={() => {
                  setEditing(null);
                  setModal(true);
                }}
              >
                <Plus size={16} /> Add Staff
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {[
                      "Name",
                      "Email",
                      "Role",
                      "Branch",
                      "Hourly Rate",
                      "Created By",
                      "Joined",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array.from({ length: 8 }).map((_, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className="h-4 bg-gray-100 rounded w-full" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : staff.map((s) => (
                        <tr
                          key={s._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                                {s.name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-800">
                                {s.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{s.email}</td>
                          <td className="px-4 py-3">
                            <RoleBadge role={s.role} />
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {s.branch?.name ?? (
                              <span className="text-gray-300 italic text-xs">
                                No branch
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            ₱{s.hourly_rate ?? 0}/hr
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {s.created_by?.name ?? (
                              <span className="text-gray-300 italic text-xs">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                            {new Date(s.createdAt).toLocaleDateString("en-PH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditing(s);
                                  setModal(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeleting(s)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
              {!loading && staff.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-4xl mb-2">👥</p>
                  <p className="text-sm">No staff found</p>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "scheduler" && (
          <SchedulerTab staff={staff} branches={branches} />
        )}
        {tab === "timelogs" && <TimeLogsTab staff={staff} />}
      </div>

      <StaffModal
        open={modal}
        onClose={() => {
          setModal(false);
          setEditing(null);
        }}
        onSuccess={fetch_staff}
        editing={editing}
      />
      <DeleteModal
        open={!!deleting}
        staff={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
