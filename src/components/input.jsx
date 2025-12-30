// --- Snippet from the updated DesignSystem.jsx ---

/**
 * Reusable Text Input Component (with added support for helperText and required indicator).
 */
export const TextInput = ({
  label,
  type = "text",
  error,
  id,
  helperText,
  required = true,
  showErrorText = true,
  className = "",
  ...props
}) => {
  const baseInputClasses = `
    mt-1 block w-full rounded-xl border p-2.5 text-base 
    transition duration-150 ease-in-out focus:outline-none
  `;

  // Dynamic styling based on error state
  const errorInputClasses = error
    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
    : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500";

  const inputClasses = [baseInputClasses, errorInputClasses, className].join(
    " "
  );

  // Dynamic styling for the label
  const labelClasses = `block text-sm font-medium ${
    error ? "text-red-600" : "text-gray-700"
  }`;

  return (
    <div className="w-full">
      {/* Label with Required Indicator */}
      {label && (
        <label htmlFor={id} className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}{" "}
          {/* REQUIRED ASTERISK */}
        </label>
      )}

      {/* Input Field */}
      <input
        id={id}
        type={type}
        className={inputClasses}
        required={required} // Pass native required attribute
        {...props}
      />

      {/* Error Message */}
      {error && showErrorText && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
