export const Field = ({ label, error, required, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
    {error && <p className="text-xs text-red-500">⚠ {error}</p>}
  </div>
);

export const Input = (props) => (
  <input
    {...props}
    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-gray-300 bg-white"
  />
);

export const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white"
  >
    {children}
  </select>
);

export const ReadOnlyField = ({ children }) => (
  <div className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
    {children}
  </div>
);

export const CurrencyInput = ({ value, onChange, ...props }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
      ₱
    </span>
    <input
      {...props}
      type="number"
      value={value}
      onChange={onChange}
      className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
    />
  </div>
);

export const PasswordInput = ({
  value,
  onChange,
  show,
  onToggle,
  ...props
}) => {
  return (
    <div className="relative">
      <input
        {...props}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-gray-300 bg-white"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
};

export const ErrorBanner = ({ error }) => {
  if (!error) return null;
  return (
    <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
      ⚠ {error}
    </p>
  );
};
