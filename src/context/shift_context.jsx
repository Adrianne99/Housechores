import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { Clock, LogIn, LogOut } from "lucide-react";
import { AppContext } from "./app_context";
import { time_of } from "../utils/format";

// Links time in/out to login/logout (with confirmation):
//  • right after logging in, staff are asked "Time in now?"
//  • logging out while timed in asks "Time out too?"
// Admins don't clock in, so they never see these prompts.
export const ASK_TIME_IN_KEY = "ask_time_in";
export const SHIFT_CHANGED_EVENT = "shift:changed";

const STAFF = ["branch_manager", "employee"];
const ShiftContext = createContext(null);

const Modal = ({ label, children }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
    <div role="dialog" aria-modal="true" aria-label={label} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
      {children}
    </div>
  </div>
);

export const ShiftProvider = ({ children }) => {
  const { userData, setIsLoggedIn, setUserData } = useContext(AppContext);
  const navigate = useNavigate();
  const is_staff = STAFF.includes(userData?.role);
  const [prompt, setPrompt] = useState(null); // "time_in" | "time_out" | null
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load_status = useCallback(async () => {
    const { data } = await axios.get("/api/timelog/my-status");
    setStatus(data.status);
    return data.status;
  }, []);

  // Just logged in? Offer to time in (once per login).
  useEffect(() => {
    if (!is_staff) return;
    let ask = false;
    try {
      ask = sessionStorage.getItem(ASK_TIME_IN_KEY) === "1";
      sessionStorage.removeItem(ASK_TIME_IN_KEY);
    } catch {
      // storage unavailable — skip the prompt
    }
    if (!ask) return;
    load_status()
      .then((s) => !s.clocked_in && setPrompt("time_in"))
      .catch(() => {});
  }, [is_staff, load_status]);

  const do_logout = useCallback(async () => {
    try {
      await axios.get("/api/auth/logout");
    } finally {
      setIsLoggedIn(false);
      setUserData(null);
      navigate("/login", { replace: true });
    }
  }, [navigate, setIsLoggedIn, setUserData]);

  // Called by every Logout button.
  const requestLogout = useCallback(async () => {
    if (!is_staff) return do_logout();
    try {
      const s = await load_status();
      if (s.clocked_in) return setPrompt("time_out");
    } catch {
      // if the status check fails, just log out
    }
    return do_logout();
  }, [is_staff, load_status, do_logout]);

  const clock = async (path) => {
    setBusy(true);
    setError(null);
    try {
      await axios.post(`/api/timelog/${path}`);
      window.dispatchEvent(new Event(SHIFT_CHANGED_EVENT));
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const first = userData?.name?.split(" ")[0] ?? "";

  return (
    <ShiftContext.Provider value={{ requestLogout }}>
      {children}

      {prompt === "time_in" && (
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
            <button type="button" onClick={() => setPrompt(null)} className="py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">
              Not now
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => (await clock("clock-in")) && setPrompt(null)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              <LogIn size={16} /> {busy ? "Saving..." : "Time in"}
            </button>
          </div>
        </Modal>
      )}

      {prompt === "time_out" && (
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
                  setPrompt(null);
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
                setPrompt(null);
                do_logout();
              }}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700"
            >
              Log out only (stay on shift)
            </button>
            <button type="button" onClick={() => setPrompt(null)} className="w-full py-2 text-sm text-gray-500">
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
