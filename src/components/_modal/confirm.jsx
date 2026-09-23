import { useState } from "react";
import { AlertTriangle, UserX, UserCheck, Trash2 } from "lucide-react";
import axios from "axios";

import { ModalShell, SimpleFooter } from "../modal_shell";
import { ErrorBanner } from "../form_primitives";

/**
 * Generic confirmation modal.
 *
 * Props:
 *  - open, onClose, onSuccess
 *  - title, message
 *  - icon: lucide icon component
 *  - confirmLabel
 *  - confirmVariant: "primary" | "danger"
 *  - method: "patch" | "delete" | "post"
 *  - url: full URL to call
 */
export const Confirm_Modal = ({
  open,
  onClose,
  onSuccess,
  title,
  message,
  icon,
  confirmLabel,
  confirmVariant = "primary",
  method = "patch",
  url,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const { data } = await axios({ method, url });
      if (!data.success) throw new Error(data.message || "Action failed.");
      onSuccess?.(data);
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
      icon={icon}
      title={title}
      size="sm"
      footer={
        <SimpleFooter
          onCancel={handleClose}
          onConfirm={handleConfirm}
          confirmLabel={confirmLabel}
          confirmVariant={confirmVariant}
          loading={loading}
        />
      }
    >
      <p className="text-sm text-gray-600">{message}</p>
      <ErrorBanner error={error} />
    </ModalShell>
  );
};

// ─── Convenience wrappers for each staff action ───────────────

export const Deactivate_Staff_Modal = ({ open, onClose, onSuccess, staff }) => {
  if (!staff) return null;
  return (
    <Confirm_Modal
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      icon={UserX}
      title="Deactivate staff"
      message={`Deactivate ${staff.name}? They will no longer be able to log in until reactivated.`}
      confirmLabel="Deactivate"
      confirmVariant="danger"
      method="patch"
      url={`/api/staff/${staff._id}/deactivate`}
    />
  );
};

export const Reactivate_Staff_Modal = ({ open, onClose, onSuccess, staff }) => {
  if (!staff) return null;
  return (
    <Confirm_Modal
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      icon={UserCheck}
      title="Reactivate staff"
      message={`Reactivate ${staff.name}? They will be able to log in again.`}
      confirmLabel="Reactivate"
      confirmVariant="primary"
      method="patch"
      url={`/api/staff/${staff._id}/reactivate`}
    />
  );
};

export const Delete_Staff_Modal = ({ open, onClose, onSuccess, staff }) => {
  if (!staff) return null;
  return (
    <Confirm_Modal
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      icon={Trash2}
      title="Delete staff permanently"
      message={`Permanently delete ${staff.name}? This cannot be undone.`}
      confirmLabel="Delete forever"
      confirmVariant="danger"
      method="delete"
      url={`/api/staff/${staff._id}`}
    />
  );
};
