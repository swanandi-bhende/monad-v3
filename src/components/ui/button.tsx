import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

const VARIANTS = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary: "border border-line text-ink hover:bg-surface-raised",
  danger: "bg-danger/90 text-canvas hover:bg-danger",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`text-caption inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    />
  );
}
