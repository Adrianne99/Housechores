import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { get, queryClient, error_message } from "../lib/query";

// Clock-in status, this week's hours, upcoming shifts and (optionally)
// recent logs for the signed-in staff member, all from the cache.
export const refresh_time_clock = () => queryClient.invalidateQueries({ queryKey: ["timelog"] });

export const useTimeClock = ({ withLogs = false } = {}) => {
  const status = useQuery({ queryKey: ["timelog", "status"], queryFn: () => get("/api/timelog/my-status") });
  const shifts = useQuery({ queryKey: ["timelog", "shifts"], queryFn: () => get("/api/schedule/mine") });
  const logs = useQuery({
    queryKey: ["timelog", "logs"],
    queryFn: () => get("/api/timelog/my-logs", { limit: 30 }),
    enabled: withLogs,
  });

  const toggle = useMutation({
    mutationFn: () =>
      axios.post(`/api/timelog/${status.data?.status?.clocked_in ? "clock-out" : "clock-in"}`),
    onSettled: refresh_time_clock,
  });

  const today = shifts.data?.today;
  const list = shifts.data?.shifts ?? [];

  return {
    status: status.data?.status ?? null,
    shifts: list,
    todays_shift: list.find((s) => s.date === today) ?? null,
    logs: logs.data?.logs ?? [],
    loading: status.isPending || shifts.isPending || (withLogs && logs.isPending),
    busy: toggle.isPending,
    error: error_message(toggle.error || status.error || shifts.error),
    toggle: () => toggle.mutate(),
    // For confirm dialogs: resolves when saved (errors surface via `error`).
    toggleAsync: () => toggle.mutateAsync().catch(() => {}),
    refresh: refresh_time_clock,
  };
};
