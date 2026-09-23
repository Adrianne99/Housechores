import { useState, useCallback } from "react";

export const useForm = (initial) => {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setForm(initial);
    setError(null);
  }, [initial]);

  return {
    form,
    setForm,
    setField,
    error,
    setError,
    loading,
    setLoading,
    reset,
  };
};
