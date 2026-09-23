import { useContext, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import axios from "axios";

import { ModalShell, SimpleFooter } from "../modal_shell";
import {
  Field,
  Input,
  Select,
  ReadOnlyField,
  CurrencyInput,
  PasswordInput,
  ErrorBanner,
} from "../form_primitives";
import { AppContext } from "../../context/app_context";
import { useForm } from "../../hooks/use_form";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "employee",
  branch: "",
  hourly_rate: "",
};

export const Add_Staff_Modal = ({ open, onClose, onSuccess }) => {
  const { userData } = useContext(AppContext);
  const isManager = userData?.role === "branch_manager";

  const { form, setField, error, setError, loading, setLoading, reset } =
    useForm(EMPTY_FORM);

  const [showPassword, setShowPassword] = useState(false);
  const [branches, setBranches] = useState([]);

  // Load branches (admin only)
  useEffect(() => {
    if (!open || isManager) return;
    axios
      .get(`${BACKEND_URL}/api/branches`)
      .then(({ data }) => {
        if (data.success) setBranches(data.branches);
      })
      .catch(console.error);
  }, [open, isManager]);

  // Auto-lock manager's branch
  useEffect(() => {
    if (open && isManager && userData?.branch) {
      const branchId =
        typeof userData.branch === "object"
          ? userData.branch._id
          : userData.branch;
      setField("branch", branchId);
      setField("role", "employee");
    }
  }, [open, isManager, userData?.branch]);

  const handleClose = () => {
    reset();
    setShowPassword(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (["employee", "branch_manager"].includes(form.role) && !form.branch) {
      return setError("Branch is required for this role.");
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/staff`, {
        ...form,
        hourly_rate: Number(form.hourly_rate) || 0,
      });
      if (!data.success)
        throw new Error(data.message || "Failed to create staff.");
      onSuccess?.(data.user);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      icon={UserPlus}
      title="Add Staff"
      subtitle={`Create a new ${isManager ? "employee" : "staff"} account`}
      footer={
        <SimpleFooter
          onCancel={handleClose}
          onConfirm={handleSubmit}
          confirmLabel="Create Account"
          loading={loading}
        />
      }
    >
      <Field label="Full Name" required>
        <Input
          placeholder="e.g. Maria Santos"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          autoFocus
        />
      </Field>

      <Field label="Email" required>
        <Input
          type="email"
          placeholder="e.g. maria.santos@example.com"
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
        />
      </Field>

      <Field
        label="Password"
        required
        hint="Tell the staff member this password — they'll use it to log in."
      >
        <PasswordInput
          placeholder="At least 8 characters"
          value={form.password}
          onChange={(e) => setField("password", e.target.value)}
          show={showPassword}
          onToggle={() => setShowPassword((p) => !p)}
        />
      </Field>

      {!isManager && (
        <Field label="Role" required>
          <Select
            value={form.role}
            onChange={(e) => setField("role", e.target.value)}
          >
            <option value="employee">Employee</option>
            <option value="branch_manager">Branch Manager</option>
          </Select>
        </Field>
      )}

      {!isManager ? (
        <Field label="Branch" required>
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
      ) : (
        <Field label="Branch" hint="Staff will be assigned to your branch.">
          <ReadOnlyField>
            {typeof userData.branch === "object"
              ? userData.branch.name
              : "Your assigned branch"}
          </ReadOnlyField>
        </Field>
      )}

      <Field label="Hourly Rate">
        <CurrencyInput
          value={form.hourly_rate}
          onChange={(e) => setField("hourly_rate", e.target.value)}
          placeholder="0.00"
        />
      </Field>

      <ErrorBanner error={error} />
    </ModalShell>
  );
};
