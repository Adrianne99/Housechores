import { useContext, useState } from "react";
import axios from "axios";
import { KeyRound } from "lucide-react";
import { AppContext } from "../context/app_context";
import { Panel } from "./panel";

// Managers/admins set the PIN cashiers type at the POS to get approval
// for senior/PWD discounts, big discounts and refunds.
export const ApprovalPinCard = () => {
  const { userData, getUserData } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ pin: "", confirm: "", password: "" });
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!["admin", "branch_manager"].includes(userData?.role)) return null;
  const has_pin = !!userData?.has_approval_pin;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value.trim() }));

  const save = async (e) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(form.pin)) return setStatus({ ok: false, text: "PIN must be 4 to 6 digits." });
    if (form.pin !== form.confirm) return setStatus({ ok: false, text: "PINs don't match." });
    setSaving(true);
    try {
      const { data } = await axios.put("/api/user/approval-pin", {
        pin: form.pin,
        password: form.password,
      });
      setStatus({ ok: true, text: data.message });
      setForm({ pin: "", confirm: "", password: "" });
      setOpen(false);
      getUserData();
    } catch (err) {
      setStatus({ ok: false, text: err.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Approval PIN">
      <div className="flex items-start gap-3">
        <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
          <KeyRound size={18} />
        </span>
        <div className="flex-1 text-sm">
          <p className="text-gray-700">
            Cashiers need your PIN at the POS for senior/PWD discounts, discounts above 20% and refunds.
            Every approval is recorded under your name.
          </p>
          <p className={`mt-1 font-medium ${has_pin ? "text-green-600" : "text-amber-600"}`}>
            {has_pin ? "PIN is set." : "No PIN yet — cashiers can't get your approval until you set one."}
          </p>
        </div>
      </div>

      {status && (
        <p className={`mt-3 text-xs px-3 py-2 rounded-lg ${status.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {status.text}
        </p>
      )}

      {open ? (
        <form onSubmit={save} className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            New PIN (4–6 digits)
            <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={form.pin} onChange={set("pin")} className="px-3 py-2 text-sm border border-gray-200 rounded-lg tracking-widest" />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Confirm PIN
            <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={form.confirm} onChange={set("confirm")} className="px-3 py-2 text-sm border border-gray-200 rounded-lg tracking-widest" />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Your account password
            <input type="password" autoComplete="current-password" value={form.password} onChange={set("password")} className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
          </label>
          <div className="sm:col-span-3 flex gap-2 justify-end">
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-sm rounded-lg border border-gray-200">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save PIN"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setStatus(null);
          }}
          className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          {has_pin ? "Change PIN" : "Set PIN"}
        </button>
      )}
    </Panel>
  );
};
