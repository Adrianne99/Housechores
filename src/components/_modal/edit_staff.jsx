import { useContext, useState } from "react";
import { useBranches } from "../../hooks/use_branches";
import { UserCog } from "lucide-react";
import axios from "axios";

import { ModalShell, SimpleFooter } from "../modal_shell";
import {
  Field,
  Input,
  Select,
  ReadOnlyField,
  CurrencyInput,
  ErrorBanner,
} from "../form_primitives";
import { AppContext } from "../../context/app_context";
import { useForm } from "../../hooks/use_form";

const EMPTY_FORM = {
  name: "",
  email: "",
  role: "employee",
  branch: "",
  hourly_rate: "",
};

const form_from = (staff) => ({
  name: staff.name ?? "",
  email: staff.email ?? "",
  role: staff.role ?? "employee",
  branch:
    typeof staff.branch === "object" ? (staff.branch?._id ?? "") : (staff.branch ?? ""),
  hourly_rate: staff.hourly_rate ?? "",
});

// Mounted only while open, starting from the chosen staff member —
// cancelled edits don't come back next time.
export const EditStaffModal = (props) =>
  props.open && props.staff ? <EditStaffBody {...props} /> : null;

const EditStaffBody = ({ open, onClose, onSuccess, staff }) => {
  const { userData } = useContext(AppContext);
  const isAdmin = userData?.role === "admin" || userData?.role === "owner";

  const [initial] = useState(() => ({ ...EMPTY_FORM, ...form_from(staff) }));
  const { form, setField, error, setError, loading, setLoading } = useForm(initial);

  const branches = useBranches({ enabled: isAdmin });

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.email.trim()) return setError("Email is required.");

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        hourly_rate: Number(form.hourly_rate) || 0,
      };
      if (isAdmin) {
        payload.role = form.role;
        payload.branch = form.branch;
      }

      const { data } = await axios.put(
        `/api/staff/${staff._id}`,
        payload,
      );
      if (!data.success) throw new Error(data.message || "Failed to update.");
      onSuccess?.(data.user);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!staff) return null;

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      icon={UserCog}
      title="Edit Staff"
      subtitle={`Update ${staff.name}'s details`}
      footer={
        <SimpleFooter
          onCancel={handleClose}
          onConfirm={handleSubmit}
          confirmLabel="Save Changes"
          loading={loading}
        />
      }
    >
      <Field label="Full Name" required>
        <Input
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
        />
      </Field>

      <Field label="Email" required>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
        />
      </Field>

      {isAdmin ? (
        <>
          <Field label="Role">
            <Select
              value={form.role}
              onChange={(e) => setField("role", e.target.value)}
            >
              <option value="employee">Employee</option>
              <option value="branch_manager">Branch Manager</option>
            </Select>
          </Field>

          <Field label="Branch">
            <Select
              value={form.branch}
              onChange={(e) => setField("branch", e.target.value)}
            >
              <option value="">Select a branch</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
        </>
      ) : (
        <>
          <Field label="Role">
            <ReadOnlyField>
              <span className="capitalize">{form.role.replace("_", " ")}</span>
            </ReadOnlyField>
          </Field>
          <Field label="Branch">
            <ReadOnlyField>
              {typeof staff.branch === "object" ? staff.branch?.name : "—"}
            </ReadOnlyField>
          </Field>
        </>
      )}

      <Field label="Hourly Rate">
        <CurrencyInput
          value={form.hourly_rate}
          onChange={(e) => setField("hourly_rate", e.target.value)}
        />
      </Field>

      <ErrorBanner error={error} />
    </ModalShell>
  );
};
