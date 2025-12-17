// Classes for Button Variants
const buttonVariantClasses = {
  primary:
    "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 focus:ring-indigo-300",
  secondary:
    "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 focus:ring-gray-300",
  danger:
    "bg-red-600 hover:bg-red-700 text-white border-red-600 focus:ring-red-300",
  ghost:
    "bg-transparent hover:bg-gray-100 text-gray-700 border-transparent focus:ring-gray-300",
};

// Classes for Button Sizes
const buttonSizeClasses = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

/**
 * Reusable Button Component.
 */
export const Button = ({
  variant = "primary",
  size = "md",
  disabled = false,
  children,
  className = "",
  ...props
}) => {
  const baseClasses = `
    font-semibold
    rounded-full 
    transition duration-150 ease-in-out
    focus:outline-none focus:ring-4 focus:ring-opacity-50
    border
    shadow-sm
    inline-flex items-center justify-center
  `;

  const variantStyle = buttonVariantClasses[variant];
  const sizeStyle = buttonSizeClasses[size];

  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed pointer-events-none"
    : "active:scale-[0.98]";

  const classes = [
    baseClasses,
    variantStyle,
    sizeStyle,
    disabledClasses,
    className,
  ].join(" ");

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
};
