import { useNow } from "../../hooks/use_now";
import { CalendarDays, LogIn, LogOut, Timer, Wallet } from "lucide-react";
import Header from "../../components/header";
import { DashboardCard } from "../../components/card";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { useTimeClock } from "../../hooks/use_time_clock";
import { ClockButton } from "../../components/clock_confirm";
import { clock_label, date_of, hours_label, peso, time_of } from "../../utils/format";
import { cn } from "../../utils/utils";

const elapsed = (from, now) => {
  const s = Math.max(0, Math.floor((now - new Date(from)) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export default function TimeClock() {
  const now = useNow();
  const clock = useTimeClock({ withLogs: true });
  const { status, shifts, todays_shift, logs, loading, error } = clock;
  const on_shift = !!status?.clocked_in;

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header title="Time Clock" subtitle="Clock in when your shift starts and out when it ends." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Clock */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
          <p className="text-sm text-gray-500">
            {now.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <p className="text-5xl font-bold text-gray-900 tabular-nums mt-2">
            {now.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", second: "2-digit" })}
          </p>

          <div
            className={cn(
              "mt-4 inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full",
              on_shift ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500",
            )}
          >
            <span className={cn("size-2 rounded-full", on_shift ? "bg-green-500 animate-pulse" : "bg-gray-400")} />
            {loading ? "Checking..." : on_shift ? `On shift since ${time_of(status.clock_in)}` : "Off shift"}
          </div>

          {on_shift && (
            <p className="mt-3 text-3xl font-mono font-semibold text-indigo-600">
              {elapsed(status.clock_in, now)}
            </p>
          )}

          <p className="mt-3 text-xs text-gray-500">
            {todays_shift
              ? `Scheduled today: ${clock_label(todays_shift.start_time)} – ${clock_label(todays_shift.end_time)}`
              : "No shift scheduled today"}
          </p>

          {error && <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Asks "Clock in/out now?" before saving */}
          <ClockButton clock={clock} iconSize={20} className="mt-5 w-full rounded-xl py-3.5 text-base font-bold" />
        </section>

        {/* Stats + upcoming shifts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DashboardCard
              title="Hours today"
              value={hours_label(status?.hours_today)}
              loading={loading}
              icon={<Timer size={20} />}
            />
            <DashboardCard
              title="Hours this week"
              value={hours_label(status?.hours_week)}
              hint="since Monday"
              loading={loading}
              icon={<CalendarDays size={20} />}
            />
            <DashboardCard
              title="Est. pay this week"
              value={peso(status?.estimated_pay_week)}
              hint={`at ${peso(status?.hourly_rate)}/hr`}
              loading={loading}
              icon={<Wallet size={20} />}
            />
          </div>

          <Panel title="Upcoming shifts (next 2 weeks)">
            {loading ? (
              <Skeleton rows={3} />
            ) : shifts.length === 0 ? (
              <EmptyState>No shifts scheduled. Your manager will post your schedule here.</EmptyState>
            ) : (
              <ul className="divide-y divide-gray-100">
                {shifts.map((s) => (
                  <li key={s._id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium text-gray-900">
                      {date_of(`${s.date}T12:00:00`, { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span className="text-gray-600">
                      {clock_label(s.start_time)} – {clock_label(s.end_time)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {s.hours}h{s.branch?.name ? ` · ${s.branch.name}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="My recent time logs">
        {loading ? (
          <Skeleton rows={4} />
        ) : logs.length === 0 ? (
          <EmptyState>No time logs yet.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Clock in</th>
                  <th className="py-2 font-medium">Clock out</th>
                  <th className="py-2 font-medium">Hours</th>
                  <th className="py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((l) => (
                  <tr key={l._id}>
                    <td className="py-2.5 text-gray-900">
                      {date_of(l.clock_in, { weekday: "short", month: "short", day: "numeric" })}
                    </td>
                    <td className="py-2.5 text-gray-600">{time_of(l.clock_in)}</td>
                    <td className="py-2.5 text-gray-600">
                      {l.clock_out ? time_of(l.clock_out) : <span className="text-green-600 font-medium">In progress</span>}
                    </td>
                    <td className="py-2.5 text-gray-900 font-medium">
                      {l.clock_out ? hours_label(l.hours_worked) : "—"}
                    </td>
                    <td className="py-2.5 text-xs text-gray-400">{l.is_manual ? `Manual · ${l.notes || ""}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
