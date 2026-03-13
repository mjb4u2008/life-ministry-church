import Link from "next/link";
import { ReactNode, ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  href?: string;
  external?: boolean;
  className?: string;
  isLoading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-water text-white font-semibold hover:bg-water-dark btn-ripple shadow-lg shadow-water/20",
  outline: "border border-water/30 text-deep hover:border-water hover:text-water",
  ghost: "text-text-body hover:text-water",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-5 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export function Button({ variant = "primary", size = "md", children, href, external, className = "", isLoading = false, disabled, ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-water focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide uppercase text-sm";
  const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  const content = isLoading ? (
    <>
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      Loading...
    </>
  ) : (
    <>
      <span className="opacity-40 mr-1.5">(</span>
      {children}
      <span className="opacity-40 ml-1.5">)</span>
    </>
  );

  if (href && external) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={combinedClassName}>{content}</a>;
  }
  if (href) {
    return <Link href={href} className={combinedClassName}>{content}</Link>;
  }
  return <button className={combinedClassName} disabled={disabled || isLoading} {...props}>{content}</button>;
}
