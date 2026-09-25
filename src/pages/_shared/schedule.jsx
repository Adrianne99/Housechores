import { useContext, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import { CalendarDays, ChevronLeft, ChevronRight, Copy, Plus, Trash2 } from "lucide-react";
import Header from "../../components/header";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { AppContext } from "../../context/app_context";
import { useBranches } from "../../hooks/use_branches";
import { get as api_get, queryClient, error_message } from "../../lib/query";
import { ROLE_LABELS, clock_label, initials, today_local } from "../../utils/format";
import { cn } from "../../utils/utils";

// ─── Dates ("YYYY-MM-DD", business timezone) ─────────────────
const add_days = (date, n) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const monday_of = (date) => {
  const d = new Date(`${date}T12:00:00Z`);
  return add_days(date, -((d.getUTCDay() + 6) % 7));
};
const day_name = (date, opts) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-PH", { timeZone: "UTC", ...opts });

const NONE = []; // stable empty list for memo deps

const PRESETS = [
  { label: "Opening", start: "06:00", end: "14:00" },
  { label: "Mid", start: "10:00", end: "18:00" },
  { label: "Closing", start: "14:00", end: "22:00" },
  { label: "Whole day", start: "08:00", end: "17:00" },
];

const hours_between = (start, end) => {
  const [a, b] = [start, end].map((t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  });
  let diff = b - a;
  if (diff < 0) diff += 1440;
  return diff / 60;
};

const refresh = () => {
  queryClient.invalidateQueries({ queryKey: ["schedule"] });
  queryClient.invalidateQueries({ queryKey: ["timelog", "shifts"] });
};

// Add / edit one shift — mounted only while open.
const ShiftDialog = ({ person, date, shift, onClose }) => {
  const [start, setStart] = useState(shift?.start_time ?? "08:00");
  const [end, setEnd] = useState(shift?.end_time ?? "17:00");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const hours = start && end && start !== end ? hours_between(start, end) : 0;

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      refresh();
      onClose();
    } catch (err) {
      setError(error_message(err));
      setBusy(false);
    }
  };
  const save = () =>
    run(() =>
      shift
        ? axios.put(`/api/schedule/${shift._id}`, { start_time: start, end_time: end })
        : axios.post("/api/schedule", { employee: person._id, date, start_time: start, end_time: end }),
    );
  const remove = () => run(() => axios.delete(`/api/schedule/${shift._id}`));

  const field = "px-3 py-2 text-sm border border-gray-200 rounded-lg";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={busy ? undefined : onClose} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Shift"
        onKeyDown={(e) => e.key === "Escape" && !busy && onClose()}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4"
      >
        <div>
          <p className="text-lg font-bold text-gray-900">{shift ? "Edit shift" : "Add shift"}</p>
          <p className="text-sm text-gray-500">
            {person.name} · {day_name(date, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setStart(p.start);
                setEnd(p.end);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full border text-xs font-semibold",
                start === p.start && end === p.end
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50",
              )}
            >
              {p.label} <span className="font-normal text-gray-400">{clock_label(p.start)}–{clock_label(p.end)}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Start
            <input autoFocus type="time" required value={start} onChange={(e) => setStart(e.target.value)} className={field} />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            End
            <input type="time" required value={end} onChange={(e) => setEnd(e.target.value)} className={field} />
          </label>
        </div>
        <p className="text-xs text-gray-500">
          {hours ? `${hours} hour(s)${hours_between(start, end) && end < start ? " · ends the next day" : ""}` : "Start and end can't be the same."}
        </p>
        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex items-center gap-2 pt-1">
          {shift && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={14} /> Remove
            </button>
          )}
          <button type="button" onClick={onClose} className="ml-auto px-4 py-2 rounded-lg border border-gray-200 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !hours}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save shift"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default function Schedule() {
  const { userData } = useContext(AppContext);
  const is_admin = userData?.role === "admin";
  const [week, setWeek] = useState(() => monday_of(today_local()));
  const [branch, setBranch] = useState("");
  const [open, setOpen] = useState(null); // { person, date, shift }
  const [copy, setCopy] = useState({ busy: false, message: null });
  const branches = useBranches({ enabled: is_admin });
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => add_days(week, i)), [week]);
  const today = today_local();

  const staff_q = useQuery({ queryKey: ["staff"], queryFn: () => api_get("/api/staff") });
  const shifts_q = useQuery({
    queryKey: ["schedule", week, branch],
    queryFn: () => api_get("/api/schedule", { start: days[0], end: days[6], ...(branch && { branch }) }),
    placeholderData: keepPreviousData,
  });
  const shifts = shifts_q.data?.shifts ?? NONE;

  // Who can be scheduled: active branch staff (managers include themselves).
  const people = useMemo(() => {
    const list = (staff_q.data?.staff ?? []).filter(
      (s) => ["employee", "branch_manager"].includes(s.role) && s.is_active !== false && s.branch,
    );
    if (userData?.role === "branch_manager" && !list.some((s) => s._id === userData._id)) {
      list.unshift({ ...userData, branch: userData.branch });
    }
    const branch_id = (s) => s.branch?._id ?? s.branch;
    return list
      .filter((s) => !branch || branch_id(s) === branch)
      .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === "branch_manager" ? -1 : 1));
  }, [staff_q.data, userData, branch]);

  const by_cell = useMemo(() => {
    const map = new Map();
    for (const s of shifts) map.set(`${s.employee?._id}|${s.date}`, s);
    return map;
  }, [shifts]);
  const hours_of = (person) => shifts.filter((s) => s.employee?._id === person._id).reduce((t, s) => t + s.hours, 0);
  const total_hours = shifts.reduce((t, s) => t + s.hours, 0);

  // Repeat last week's shifts into this week (skips days already filled).
  const copy_last_week = async () => {
    setCopy({ busy: true, message: null });
    try {
      const prev = await api_get("/api/schedule", { start: add_days(week, -7), end: add_days(week, -1), ...(branch && { branch }) });
      const todo = (prev.shifts ?? [])
        .map((s) => ({ employee: s.employee?._id, date: add_days(s.date, 7), start_time: s.start_time, end_time: s.end_time }))
        .filter((s) => s.employee && s.date >= today && !by_cell.has(`${s.employee}|${s.date}`));
      const results = await Promise.allSettled(todo.map((s) => axios.post("/api/schedule", s)));
      const ok = results.filter((r) => r.status === "fulfilled").length;
      refresh();
      setCopy({
        busy: false,
        message: prev.shifts?.length
          ? `Copied ${ok} shift(s) from last week${ok < todo.length ? ` · ${todo.length - ok} skipped` : ""}.`
          : "Last week has no shifts to copy.",
      });
    } catch (err) {
      setCopy({ busy: false, message: error_message(err) });
    }
  };

  const week_label = `${day_name(days[0], { month: "short", day: "numeric" })} – ${day_name(days[6], { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header title="Schedule" subtitle="Plan who works when. Staff see their shifts on Time Clock and get notified of changes." />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-gray-200 bg-white">
          <button type="button" aria-label="Previous week" onClick={() => setWeek((w) => add_days(w, -7))} className="p-2 hover:bg-gray-50 rounded-l-lg">
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 text-sm font-medium text-gray-700 flex items-center gap-2">
            <CalendarDays size={14} className="text-gray-400" />
            {week_label}
          </span>
          <button type="button" aria-label="Next week" onClick={() => setWeek((w) => add_days(w, 7))} className="p-2 hover:bg-gray-50 rounded-r-lg">
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setWeek(monday_of(today))}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
        >
          This week
        </button>
        {is_admin && (
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" aria-label="Branch">
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={copy_last_week}
          disabled={copy.busy || days[6] < today}
          className="ml-auto flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 disabled:opacity-50"
        >
          <Copy size={14} /> {copy.busy ? "Copying..." : "Copy last week"}
        </button>
      </div>
      {copy.message && <p className="text-sm text-indigo-800 bg-indigo-50 rounded-xl px-4 py-2">{copy.message}</p>}
      {(shifts_q.error || staff_q.error) && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error_message(shifts_q.error || staff_q.error)}</p>}

      <Panel title={`Week of ${day_name(days[0], { month: "long", day: "numeric" })} · ${shifts.length} shift(s) · ${total_hours}h`}>
        {staff_q.isPending || shifts_q.isPending ? (
          <Skeleton rows={4} className="h-14" />
        ) : people.length === 0 ? (
          <EmptyState>No staff to schedule yet. Add cashiers in Staff Management.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="text-left text-xs text-gray-500 font-medium px-2 py-1 w-48">Staff</th>
                  {days.map((d) => (
                    <th key={d} className={cn("text-xs font-medium px-2 py-1 rounded-lg", d === today ? "bg-indigo-50 text-indigo-700" : "text-gray-500")}>
                      {day_name(d, { weekday: "short" })}
                      <span className="block text-[11px] font-normal">{day_name(d, { month: "short", day: "numeric" })}</span>
                    </th>
                  ))}
                  <th className="text-right text-xs text-gray-500 font-medium px-2 py-1">Hours</th>
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p._id}>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="size-8 shrink-0 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">{initials(p.name)}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{p.name}</p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {ROLE_LABELS[p.role]}
                            {is_admin && !branch && p.branch?.name ? ` · ${p.branch.name}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    {days.map((d) => {
                      const s = by_cell.get(`${p._id}|${d}`);
                      const past = d < today;
                      return (
                        <td key={d} className="p-0 align-top">
                          {s ? (
                            <button
                              type="button"
                              onClick={() => setOpen({ person: p, date: d, shift: s })}
                              aria-label={`Edit ${p.name}'s shift on ${d}`}
                              className="w-full h-14 rounded-lg bg-indigo-50 border border-indigo-100 hover:border-indigo-300 text-left px-2 py-1"
                            >
                              <span className="block text-xs font-semibold text-indigo-800">{clock_label(s.start_time)}</span>
                              <span className="block text-[11px] text-indigo-500">to {clock_label(s.end_time)}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={past}
                              onClick={() => setOpen({ person: p, date: d, shift: null })}
                              aria-label={`Add shift for ${p.name} on ${d}`}
                              className="w-full h-14 rounded-lg border border-dashed border-gray-200 text-gray-300 hover:text-indigo-500 hover:border-indigo-300 flex items-center justify-center disabled:opacity-40 disabled:hover:text-gray-300 disabled:hover:border-gray-200"
                            >
                              {!past && <Plus size={14} />}
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-1 text-right tabular-nums text-gray-700 font-medium">{hours_of(p)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {open && <ShiftDialog {...open} onClose={() => setOpen(null)} />}
    </div>
  );
}
