const buttonVariantClasses = {
  primary:
    "bg-gradient-to-br from-primary via-second-gradient to-third-gradient hover:to-indigo-200 text-white border-indigo-600 focus:ring-indigo-300",
  secondary:
    "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 focus:ring-gray-300",
  danger:
    "bg-red-600 hover:bg-red-700 text-white border-red-600 focus:ring-red-300",
  ghost:
    "bg-transparent hover:bg-gray-100 text-gray-700 border-transparent focus:ring-gray-300",
  warning:
    "bg-amber-500 hover:bg-amber-600 text-white border-amber-500 focus:ring-amber-300",
  success:
    "bg-green-600 hover:bg-green-700 text-white border-green-600 focus:ring-green-300",
};

const buttonSizeClasses = {
  sm: "px-3 py-1 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-2.5 text-base gap-2",
};

export const Button = ({
  variant = "primary",
  size = "md",
  disabled = false,
  children,
  className = "",
  type = "button",
  ...props
}) => {
  const classes = [
    "font-medium cursor-pointer rounded-xl inline-flex items-center justify-center",
    " transition-all duration-200 ease-in-out font-inter",
    "active:scale-[0.98]",
    buttonVariantClasses[variant] ?? buttonVariantClasses.primary,
    buttonSizeClasses[size] ?? buttonSizeClasses.md,
    disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
    className,
  ].join(" ");

  return (
    <button type={type} className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
};
