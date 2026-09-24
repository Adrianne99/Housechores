import { useQuery } from "@tanstack/react-query";
import { get } from "../lib/query";

// Branches of the organization (admin-only endpoint), cached app-wide.
export const useBranches = ({ enabled = true } = {}) => {
  const q = useQuery({
    queryKey: ["branches"],
    queryFn: () => get("/api/branches"),
    select: (data) => data.branches ?? [],
    enabled,
  });
  return q.data ?? [];
};
