import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { get } from "../lib/query";
import { get_snapshot, subscribe } from "../lib/offline_sales";

// Store details for receipts (name, TIN, address, paper width…).
export const useStoreSettings = () => {
  const q = useQuery({ queryKey: ["settings"], queryFn: () => get("/api/settings"), staleTime: 10 * 60_000 });
  return q.data?.settings ?? null;
};

// Offline sales queue + connection status, live.
export const useOfflineSales = () => useSyncExternalStore(subscribe, get_snapshot);
