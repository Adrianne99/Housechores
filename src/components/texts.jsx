// Classes for Heading Levels
const headingClasses = {
  h1: "text-4xl font-extrabold text-neutral-900 tracking-tight sm:text-5xl font-inter",
  h2: "text-3xl font-bold text-neutral-800 tracking-tight font-inter",
  h3: "text-2xl font-semibold text-neutral-700 font-inter ",
  h4: "text-xl font-medium text-neutral-600 font-inter ",
  h5: "text-lg font-medium text-neutral-700 font-inter ",
  h6: "text-xs lg:text-base font-normal text-neutral-400 font-inter",
};

/**
 * Base Heading Component (Internal use only).
 */
const Heading = ({ level, className = "", children, ...props }) => {
  const Tag = `h${level}`.toLowerCase();
  const defaultClasses = headingClasses[Tag] || headingClasses.h2;
  const classes = `${defaultClasses} ${className}`;

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
};

// Exporting individual Heading Components
export const H1 = (props) => <Heading level={1} {...props} />;
export const H2 = (props) => <Heading level={2} {...props} />;
export const H3 = (props) => <Heading level={3} {...props} />;
export const H4 = (props) => <Heading level={4} {...props} />;
export const H5 = (props) => <Heading level={5} {...props} />;
export const H6 = (props) => <Heading level={6} {...props} />;

// Classes for Paragraph Variants
const paragraphClasses = {
  base: "text-base text-gray-700 leading-relaxed mb-4",
  lead: "text-xl text-gray-800 leading-normal mb-6 font-light",
  small: "text-sm text-gray-500 leading-tight mb-2",
  quote:
    "text-lg italic text-gray-600 border-l-4 border-indigo-500 pl-4 py-1 my-6",
};

/**
 * Reusable Paragraph Component.
 */
export const Paragraph = ({
  variant = "base",
  bold = false,
  italic = false,
  className = "",
  children,
  ...props
}) => {
  const defaultClasses = paragraphClasses[variant] || paragraphClasses.base;

  const modifiers = [bold ? "font-bold" : "", italic ? "italic" : ""].join(" ");

  const classes = `${defaultClasses} ${modifiers} ${className}`;

  // Use a <blockquote> tag for quotes
  const Tag = variant === "quote" ? "blockquote" : "p";

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
};
