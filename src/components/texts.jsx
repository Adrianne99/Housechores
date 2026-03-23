import React from "react";
import { cn } from "../utils/utils";

// Shadcn/ui Standard Heading Scale
const headingClasses = {
  // Mobile (xs) -> Desktop (md+)
  h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-neutral-900",
  h2: "scroll-m-20 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-neutral-800",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight text-neutral-800",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight text-neutral-700",
  h5: "scroll-m-20 text-base font-semibold tracking-tight text-neutral-700",
  h6: "text-sm font-medium leading-none text-neutral-500 uppercase tracking-wider", // Label style
};

const Heading = ({ level, className = "", children, ...props }) => {
  const Tag = `h${level}`;
  const defaultClasses = headingClasses[Tag] || headingClasses.h2;

  return (
    <Tag className={cn(defaultClasses, className)} {...props}>
      {children}
    </Tag>
  );
};

export const H1 = (props) => <Heading level={1} {...props} />;
export const H2 = (props) => <Heading level={2} {...props} />;
export const H3 = (props) => <Heading level={3} {...props} />;
export const H4 = (props) => <Heading level={4} {...props} />;
export const H5 = (props) => <Heading level={5} {...props} />;
export const H6 = (props) => <Heading level={6} {...props} />;

// Shadcn Paragraph & Typography Variants
const paragraphClasses = {
  base: "leading-7 [&:not(:first-child)]:mt-6 text-neutral-600",
  lead: "text-xl text-neutral-500",
  small: "text-sm font-medium leading-none text-neutral-500",
  quote: "mt-6 border-l-2 border-neutral-300 pl-6 italic text-neutral-700",
  muted: "text-xs text-neutral-500", // Standard Shadcn muted text
};

export const Paragraph = ({
  variant = "base",
  bold = false,
  italic = false,
  className = "",
  children,
  ...props
}) => {
  const defaultClasses = paragraphClasses[variant] || paragraphClasses.base;
  const Tag = variant === "quote" ? "blockquote" : "p";

  return (
    <Tag
      className={cn(
        defaultClasses,
        bold && "font-bold",
        italic && "italic",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
};
