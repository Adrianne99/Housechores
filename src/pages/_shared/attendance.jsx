import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AlertTriangle, Clock, Download, Timer, Users, Wallet } from "lucide-react";
import Header from "../../components/header";
import { DashboardCard } from "../../components/card";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { AppContext } from "../../context/app_context";
import { ROLE_LABELS, date_of, hours_label, initials, peso, time_of, today_local } from "../../utils/format";
import { cn } from "../../utils/utils";

// Monday of the current week (business timezone), "YYYY-MM-DD".
const week_start = () => {
  const today = today_local();
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

const live_hours = (l, now) =>
  l.clock_out ? l.hours_worked : Math.max(0, (now - new Date(l.clock_in)) / 3600000);

// "2026-09-25T08:30" in local time, for <input type="datetime-local">
const to_local_input = (d) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 16);
};

const csv_cell = (v) => {
  const s = String(v ?? "");
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; // no spreadsheet formulas
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export default function Attendance() {
  const { userData } = useContext(AppContext);
  const is_admin = userData?.role === "admin";
  const [filters, setFilters] = useState({ from: week_start(), to: today_local(), branch: "", employee_id: "", status: "" });
  const [logs, setLogs] = useState([]);
  const [onShift, setOnShift] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fix, setFix] = useState(null); // { log, value, error, busy }
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!is_admin) return;
    axios.get("/api/branches").then(({ data }) => setBranches(data.branches ?? [])).catch(() => {});
  }, [is_admin]);

  useEffect(() => {
    let stale = false;
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    Promise.all([
      axios.get("/api/timelog", { params }),
      axios.get("/api/timelog/on-shift", { params: filters.branch ? { branch: filters.branch } : {} }),
    ])
      .then(([a, b]) => {
        if (stale) return;
        setLogs(a.data.logs ?? []);
        setOnShift(b.data.logs ?? []);
        setError(null);
      })
      .catch((err) => !stale && setError(err.response?.data?.message || err.message))
      .finally(() => !stale && setLoading(false));
    return () => {
      stale = true;
    };
  }, [filters, refreshKey]);

  const set = (k, v) => {
    setLoading(true);
    setFilters((f) => ({ ...f, [k]: v }));
  };

  // Staff list for the filter, from what's loaded.
  const staff = useMemo(() => {
    const map = new Map();
    for (const l of [...logs, ...onShift]) if (l.employee) map.set(l.employee._id, l.employee);
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [logs, onShift]);

  // Per-person totals for the period.
  const totals = useMemo(() => {
    const map = new Map();
    for (const l of logs) {
      if (!l.employee) continue;
      const t = map.get(l.employee._id) ?? { employee: l.employee, branch: l.branch?.name, days: new Set(), hours: 0, pay: 0, missing: 0 };
      t.days.add(l.date);
      if (l.clock_out) {
        t.hours += l.hours_worked;
        t.pay += l.computed_salary;
      }
      if (l.missing_out) t.missing += 1;
      map.set(l.employee._id, t);
    }
    return [...map.values()].sort((a, b) => b.hours - a.hours);
  }, [logs]);

  const total_hours = totals.reduce((t, x) => t + x.hours, 0);
  const total_pay = totals.reduce((t, x) => t + x.pay, 0);
  const missing_count = logs.filter((l) => l.missing_out).length;

  const export_csv = () => {
    const rows = [
      ["Date", "Name", "Role", "Branch", "Time in", "Time out", "Hours", "Hourly rate", "Pay", "Note"],
      ...logs.map((l) => [
        l.date,
        l.employee?.name,
        ROLE_LABELS[l.employee?.role] ?? l.employee?.role,
        l.branch?.name,
        new Date(l.clock_in).toLocaleString("en-PH"),
        l.clock_out ? new Date(l.clock_out).toLocaleString("en-PH") : l.missing_out ? "MISSING" : "On shift",
        l.clock_out ? l.hours_worked : "",
        l.hourly_rate,
        l.clock_out ? l.computed_salary : "",
        l.notes,
      ]),
    ];
    const blob = new Blob(["﻿" + rows.map((r) => r.map(csv_cell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `attendance_${filters.from}_to_${filters.to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const save_fix = async () => {
    setFix((f) => ({ ...f, busy: true, error: null }));
    try {
      await axios.patch(`/api/timelog/${fix.log._id}/close`, {
        clock_out: new Date(fix.value).toISOString(),
        notes: fix.note,
      });
      setFix(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setFix((f) => ({ ...f, busy: false, error: err.response?.data?.message || err.message }));
    }
  };

  const can_fix = (l) => String(l.employee?._id) !== String(userData?._id);

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header
        title="Attendance"
        subtitle={is_admin ? "Time in and time out of every manager and cashier." : "Time in and time out of your branch staff."}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <DashboardCard title="On shift now" value={onShift.length} loading={loading} icon={<Users size={20} />} hint="currently timed in" />
        <DashboardCard title="Hours worked" value={hours_label(total_hours)} loading={loading} icon={<Timer size={20} />} hint="completed shifts in range" />
        <DashboardCard title="Estimated pay" value={peso(total_pay)} loading={loading} icon={<Wallet size={20} />} hint="hours × hourly rate" />
        <DashboardCard title="Missing time out" value={missing_count} loading={loading} icon={<AlertTriangle size={20} />} hint="open 12+ hours" />
      </div>

      <Panel title="On shift now">
        {loading ? (
          <Skeleton rows={2} />
        ) : onShift.length === 0 ? (
          <EmptyState>Nobody is timed in right now.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {onShift.map((l) => (
              <div key={l._id} className={cn("flex items-center gap-3 rounded-xl border p-3", l.missing_out ? "border-red-200 bg-red-50" : "border-green-100 bg-green-50")}>
                <span className="size-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {initials(l.employee?.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{l.employee?.name}</p>
                  <p className="text-xs text-gray-500">
                    {ROLE_LABELS[l.employee?.role]}
                    {is_admin && l.branch?.name ? ` · ${l.branch.name}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn("text-xs font-semibold", l.missing_out ? "text-red-600" : "text-green-700")}>
                    {l.missing_out ? "Missing time out" : `In since ${time_of(l.clock_in)}`}
                  </p>
                  <p className="text-xs text-gray-500">{hours_label(live_hours(l, now))}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Time logs"
        action={
          <button type="button" onClick={export_csv} disabled={!logs.length} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline disabled:opacity-40">
            <Download size={14} /> Export CSV
          </button>
        }
      >
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            From
            <input type="date" value={filters.from} max={filters.to} onChange={(e) => set("from", e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            To
            <input type="date" value={filters.to} min={filters.from} onChange={(e) => set("to", e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
          </label>
          {is_admin && (
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Branch
              <select value={filters.branch} onChange={(e) => set("branch", e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white min-w-36">
                <option value="">All branches</option>
                {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </label>
          )}
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Staff
            <select value={filters.employee_id} onChange={(e) => set("employee_id", e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white min-w-40">
              <option value="">Everyone</option>
              {staff.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Show
            <select value={filters.status} onChange={(e) => set("status", e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
              <option value="">All shifts</option>
              <option value="open">Still timed in</option>
              <option value="missing">Missing time out</option>
            </select>
          </label>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg mb-3">⚠ {error}</p>}

        {loading ? (
          <Skeleton rows={6} />
        ) : logs.length === 0 ? (
          <EmptyState>No time logs in this range.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Staff</th>
                  {is_admin && <th className="py-2 font-medium">Branch</th>}
                  <th className="py-2 font-medium">Time in</th>
                  <th className="py-2 font-medium">Time out</th>
                  <th className="py-2 font-medium text-right">Hours</th>
                  <th className="py-2 font-medium text-right">Pay</th>
                  <th className="py-2 pl-6 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((l) => (
                  <tr key={l._id} className={l.missing_out ? "bg-red-50/60" : ""}>
                    <td className="py-2.5 text-gray-600 whitespace-nowrap">{date_of(`${l.date}T12:00:00`, { weekday: "short", month: "short", day: "numeric" })}</td>
                    <td className="py-2.5">
                      <p className="font-medium text-gray-900">{l.employee?.name ?? "Deleted user"}</p>
                      <p className="text-xs text-gray-400">{ROLE_LABELS[l.employee?.role] ?? ""}</p>
                    </td>
                    {is_admin && <td className="py-2.5 text-gray-600">{l.branch?.name}</td>}
                    <td className="py-2.5 text-gray-900">{time_of(l.clock_in)}</td>
                    <td className="py-2.5">
                      {l.clock_out ? (
                        <span className="text-gray-900">{time_of(l.clock_out)}</span>
                      ) : l.missing_out ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Missing time out</span>
                          {can_fix(l) && (
                            <button
                              type="button"
                              onClick={() => setFix({ log: l, value: to_local_input(new Date(new Date(l.clock_in).getTime() + 8 * 3600000)), note: "" })}
                              className="text-xs font-semibold text-indigo-600 hover:underline"
                            >
                              Set time out
                            </button>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">On shift</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{l.clock_out ? hours_label(l.hours_worked) : hours_label(live_hours(l, now))}</td>
                    <td className="py-2.5 text-right tabular-nums">{l.clock_out ? peso(l.computed_salary) : "—"}</td>
                    <td className="py-2.5 pl-6 text-xs text-gray-400 max-w-48 truncate" title={l.notes}>
                      {l.is_manual ? "Manual · " : ""}
                      {l.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Totals per person">
        {loading ? (
          <Skeleton rows={3} />
        ) : totals.length === 0 ? (
          <EmptyState>No hours in this range.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 font-medium">Staff</th>
                  <th className="py-2 font-medium text-right">Days</th>
                  <th className="py-2 font-medium text-right">Hours</th>
                  <th className="py-2 font-medium text-right">Rate</th>
                  <th className="py-2 font-medium text-right">Est. pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {totals.map((t) => (
                  <tr key={t.employee._id}>
                    <td className="py-2.5">
                      <p className="font-medium text-gray-900">{t.employee.name}</p>
                      <p className="text-xs text-gray-400">
                        {ROLE_LABELS[t.employee.role]}
                        {is_admin && t.branch ? ` · ${t.branch}` : ""}
                        {t.missing ? <span className="text-red-500"> · {t.missing} missing time out</span> : null}
                      </p>
                    </td>
                    <td className="py-2.5 text-right">{t.days.size}</td>
                    <td className="py-2.5 text-right tabular-nums">{hours_label(t.hours)}</td>
                    <td className="py-2.5 text-right tabular-nums">{peso(t.employee.hourly_rate)}/hr</td>
                    <td className="py-2.5 text-right tabular-nums font-semibold">{peso(t.pay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {fix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => !fix.busy && setFix(null)} />
          <div role="dialog" aria-modal="true" aria-label="Set time out" className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-3">
            <p className="font-bold text-gray-900 flex items-center gap-2"><Clock size={18} /> Set time out for {fix.log.employee?.name}</p>
            <p className="text-sm text-gray-600">
              Timed in {date_of(fix.log.clock_in)} at {time_of(fix.log.clock_in)} and never timed out. Enter when they actually left.
            </p>
            <input
              type="datetime-local"
              aria-label="Time out"
              value={fix.value}
              min={to_local_input(fix.log.clock_in)}
              max={to_local_input(new Date())}
              onChange={(e) => setFix((f) => ({ ...f, value: e.target.value, error: null }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
            <input
              value={fix.note}
              onChange={(e) => setFix((f) => ({ ...f, note: e.target.value }))}
              placeholder="Note (optional) — e.g. confirmed with CCTV"
              aria-label="Note"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
            />
            {fix.error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{fix.error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setFix(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Cancel</button>
              <button type="button" onClick={save_fix} disabled={fix.busy || !fix.value} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50">
                {fix.busy ? "Saving..." : "Save time out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
