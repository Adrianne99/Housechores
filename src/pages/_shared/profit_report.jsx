import { useContext, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Coins, Download, PiggyBank, Percent, TrendingUp } from "lucide-react";
import Header from "../../components/header";
import { DashboardCard } from "../../components/card";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { AppContext } from "../../context/app_context";
import { useBranches } from "../../hooks/use_branches";
import { get, error_message } from "../../lib/query";
import { num, peso, today_local } from "../../utils/format";
import { cn } from "../../utils/utils";

const add_days = (date, n) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const PRESETS = [
  { key: "today", label: "Today", range: (t) => [t, t] },
  { key: "7", label: "Last 7 days", range: (t) => [add_days(t, -6), t] },
  { key: "30", label: "Last 30 days", range: (t) => [add_days(t, -29), t] },
  { key: "month", label: "This month", range: (t) => [`${t.slice(0, 8)}01`, t] },
];
const short_day = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "UTC" });
const plain = (n) => Number(n ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const csv_cell = (v) => {
  const s = String(v ?? "");
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export default function ProfitReport() {
  const { userData } = useContext(AppContext);
  const is_admin = userData?.role === "admin";
  const today = today_local();
  const [range, setRange] = useState(() => PRESETS[1].range(today));
  const [preset, setPreset] = useState("7");
  const [branch, setBranch] = useState("");
  const branches = useBranches({ enabled: is_admin });
  const params = { from: range[0], to: range[1], ...(branch && { branch }) };
  const q = useQuery({ queryKey: ["orders", "profit", params], queryFn: () => get("/api/reports/profit", params), placeholderData: keepPreviousData });
  const r = q.data;
  const t = r?.totals ?? {};
  const max_day = Math.max(1, ...(r?.by_day ?? []).map((d) => d.revenue));

  const export_csv = () => {
    const rows = [
      ["Product", "Category", "Units sold", "Revenue", "Cost", "Profit", "Margin %"],
      ...r.by_product.map((p) => [p.name, p.category, p.units, p.revenue, p.cost, p.profit, p.margin]),
      [],
      ["Total", "", t.units, t.revenue, t.cost, t.profit, t.margin],
    ];
    const blob = new Blob(["﻿" + rows.map((row) => row.map(csv_cell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `profit_${range[0]}_to_${range[1]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header title="Profit Report" subtitle="What you sold, what it cost you, and what you kept." />

      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              setPreset(p.key);
              setRange(p.range(today));
            }}
            className={cn("px-3 py-1.5 text-xs font-semibold rounded-full border", preset === p.key ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50")}
          >
            {p.label}
          </button>
        ))}
        <input type="date" aria-label="From" value={range[0]} max={range[1]} onChange={(e) => e.target.value && (setPreset(null), setRange([e.target.value, range[1]]))} className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white" />
        <span className="text-gray-400">to</span>
        <input type="date" aria-label="To" value={range[1]} min={range[0]} max={today} onChange={(e) => e.target.value && (setPreset(null), setRange([range[0], e.target.value]))} className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white" />
        {is_admin && (
          <select value={branch} onChange={(e) => setBranch(e.target.value)} aria-label="Branch" className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white">
            <option value="">All branches</option>
            {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        )}
        <button type="button" onClick={export_csv} disabled={!r?.by_product?.length} className="ml-auto flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 disabled:opacity-50">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {q.error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error_message(q.error)}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <DashboardCard title="Revenue" sign="₱" value={plain(t.revenue)} loading={q.isPending} icon={<Coins size={20} />} hint={`${num(t.orders)} sale(s) · ${num(t.units)} unit(s)`} />
        <DashboardCard title="Cost of goods" sign="₱" value={plain(t.cost)} loading={q.isPending} icon={<TrendingUp size={20} />} hint="what those items cost you" />
        <DashboardCard title="Gross profit" sign="₱" value={plain(t.profit)} loading={q.isPending} icon={<PiggyBank size={20} />} hint="before rent, salaries, bills" />
        <DashboardCard title="Margin" value={`${t.margin ?? 0}%`} loading={q.isPending} icon={<Percent size={20} />} hint="profit ÷ revenue" />
      </div>
      {(t.estimated_lines > 0 || t.custom_revenue > 0) && (
        <p className="text-xs text-gray-500">
          {t.estimated_lines > 0 && `${t.estimated_lines} older sale line(s) used today's cost (costs weren't recorded yet). `}
          {t.custom_revenue > 0 && `${peso(t.custom_revenue)} from typed-in items has no known cost.`}
        </p>
      )}

      <Panel title="Revenue and profit by day">
        {q.isPending ? (
          <Skeleton rows={3} />
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1.5 h-44 min-w-[480px]" role="img" aria-label="Daily revenue and profit">
              {r.by_day.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${short_day(d.date)}: revenue ${peso(d.revenue)}, profit ${peso(d.profit)}`}>
                  <div className="w-full flex flex-col justify-end rounded-t bg-indigo-100" style={{ height: `${Math.max(2, (d.revenue / max_day) * 100)}%` }}>
                    <div className="w-full rounded-t bg-emerald-500" style={{ height: `${d.revenue ? Math.max(0, (d.profit / d.revenue) * 100) : 0}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{r.by_day.length > 14 ? short_day(d.date).split(" ")[1] : short_day(d.date)}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500 flex gap-4">
              <span><span className="inline-block size-2.5 rounded-sm bg-indigo-100 mr-1" />Revenue</span>
              <span><span className="inline-block size-2.5 rounded-sm bg-emerald-500 mr-1" />Profit</span>
            </p>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Products by profit" className="xl:col-span-2">
          {q.isPending ? (
            <Skeleton rows={5} />
          ) : !r.by_product.length ? (
            <EmptyState>No sales in this period.</EmptyState>
          ) : (
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="py-2 font-medium">Product</th>
                    <th className="py-2 font-medium text-right">Sold</th>
                    <th className="py-2 font-medium text-right">Revenue</th>
                    <th className="py-2 font-medium text-right">Profit</th>
                    <th className="py-2 font-medium text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {r.by_product.map((p) => (
                    <tr key={p.inventory}>
                      <td className="py-2">
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.category}</p>
                      </td>
                      <td className="py-2 text-right tabular-nums text-gray-600">{num(p.units)}</td>
                      <td className="py-2 text-right tabular-nums text-gray-600">{peso(p.revenue)}</td>
                      <td className={cn("py-2 text-right tabular-nums font-semibold", p.profit < 0 ? "text-red-600" : "text-emerald-700")}>{peso(p.profit)}</td>
                      <td className={cn("py-2 text-right tabular-nums", p.margin < 10 ? "text-amber-600" : "text-gray-600")}>{p.margin}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="By category">
            {q.isPending ? (
              <Skeleton rows={3} />
            ) : !r.by_category.length ? (
              <EmptyState>No sales.</EmptyState>
            ) : (
              <ul className="space-y-2 text-sm">
                {r.by_category.map((c) => (
                  <li key={c.category} className="flex justify-between gap-2">
                    <span className="text-gray-700">{c.category}</span>
                    <span className="tabular-nums text-gray-900 font-medium">{peso(c.profit)} <span className="text-xs text-gray-400">({c.margin}%)</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Slow movers (not sold)">
            {q.isPending ? (
              <Skeleton rows={3} />
            ) : !r.slow_movers.length ? (
              <EmptyState>Everything in stock sold at least once.</EmptyState>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-2">In stock, zero sales this period — money sitting on the shelf.</p>
                <ul className="space-y-2 text-sm">
                  {r.slow_movers.map((s) => (
                    <li key={s.inventory} className="flex justify-between gap-2">
                      <span className="text-gray-700 truncate">{s.name} <span className="text-xs text-gray-400">· {s.stock} left{is_admin && !branch && s.branch ? ` · ${s.branch}` : ""}</span></span>
                      <span className="tabular-nums text-gray-600 shrink-0">{peso(s.value)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
