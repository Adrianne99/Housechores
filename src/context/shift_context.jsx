import { createContext, useCallback, useContext, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Clock, LogIn, LogOut } from "lucide-react";
import { AppContext } from "./app_context";
import { get, queryClient, error_message, clear_session_cache } from "../lib/query";
import { refresh_time_clock } from "../hooks/use_time_clock";
import { time_of } from "../utils/format";

// Links time in/out to login/logout (with confirmation):
//  • right after logging in, staff are asked "Time in now?"
//  • logging out while timed in asks "Time out too?"
// Admins don't clock in, so they never see these prompts.
export const ASK_TIME_IN_KEY = "ask_time_in";

const STAFF = ["branch_manager", "employee"];
const ShiftContext = createContext(null);

const read_flag = () => {
  try {
    return sessionStorage.getItem(ASK_TIME_IN_KEY) === "1";
  } catch {
    return false;
  }
};
const clear_flag = () => {
  try {
    sessionStorage.removeItem(ASK_TIME_IN_KEY);
  } catch {
    // storage unavailable
  }
};

const Modal = ({ label, children }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
    <div role="dialog" aria-modal="true" aria-label={label} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
      {children}
    </div>
  </div>
);

export const ShiftProvider = ({ children }) => {
  const { userData } = useContext(AppContext);
  const navigate = useNavigate();
  const is_staff = STAFF.includes(userData?.role);
  const [askTimeIn, setAskTimeIn] = useState(read_flag); // set by the login page
  const [askTimeOut, setAskTimeOut] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Same cache entry as the Time Clock page.
  const status_q = useQuery({
    queryKey: ["timelog", "status"],
    queryFn: () => get("/api/timelog/my-status"),
    enabled: is_staff,
  });
  const status = status_q.data?.status;

  // Show "Time in now?" once the status is known and they're not timed in.
  const show_time_in = is_staff && askTimeIn && status && !status.clocked_in;

  const dismiss_time_in = () => {
    clear_flag();
    setAskTimeIn(false);
  };

  const do_logout = useCallback(async () => {
    clear_flag();
    try {
      await axios.get("/api/auth/logout");
    } finally {
      clear_session_cache();
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Called by every Logout button.
  const requestLogout = useCallback(async () => {
    if (!is_staff) return do_logout();
    try {
      const fresh = await queryClient.fetchQuery({
        queryKey: ["timelog", "status"],
        queryFn: () => get("/api/timelog/my-status"),
        staleTime: 0,
      });
      if (fresh.status?.clocked_in) return setAskTimeOut(true);
    } catch {
      // if the status check fails, just log out
    }
    return do_logout();
  }, [is_staff, do_logout]);

  const clock = async (path) => {
    setBusy(true);
    setError(null);
    try {
      await axios.post(`/api/timelog/${path}`);
      await refresh_time_clock();
      return true;
    } catch (err) {
      setError(error_message(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const first = userData?.name?.split(" ")[0] ?? "";

  return (
    <ShiftContext.Provider value={{ requestLogout }}>
      {children}

      {show_time_in && (
        <Modal label="Time in">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Clock size={24} />
          </span>
          <p className="text-lg font-bold text-gray-900">Start your shift{first ? `, ${first}` : ""}?</p>
          <p className="text-sm text-gray-500 mt-1">
            Time in now at <span className="font-semibold text-gray-900">{time_of(new Date())}</span>
          </p>
          {error && <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" onClick={dismiss_time_in} className="py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">
              Not now
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => (await clock("clock-in")) && dismiss_time_in()}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              <LogIn size={16} /> {busy ? "Saving..." : "Time in"}
            </button>
          </div>
        </Modal>
      )}

      {askTimeOut && (
        <Modal label="Time out">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Clock size={24} />
          </span>
          <p className="text-lg font-bold text-gray-900">You're still timed in</p>
          <p className="text-sm text-gray-500 mt-1">
            Since {time_of(status?.clock_in)}. Time out now at{" "}
            <span className="font-semibold text-gray-900">{time_of(new Date())}</span>?
          </p>
          {error && <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="mt-5 space-y-2">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (await clock("clock-out")) {
                  setAskTimeOut(false);
                  do_logout();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              <LogOut size={16} /> {busy ? "Saving..." : "Time out & log out"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAskTimeOut(false);
                do_logout();
              }}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700"
            >
              Log out only (stay on shift)
            </button>
            <button type="button" onClick={() => setAskTimeOut(false)} className="w-full py-2 text-sm text-gray-500">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </ShiftContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useShift = () => useContext(ShiftContext);
