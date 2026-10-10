import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark";
};

const VARIANTS = {
  primary: "bg-accent text-accent-ink hover:bg-accent/90",
  secondary: "glass border border-white text-ink hover:bg-white",
  ghost: "text-ink hover:bg-ink/5",
  danger: "bg-danger text-accent-ink hover:bg-danger/90",
  dark: "bg-ink text-canvas hover:bg-ink/90",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`text-body rounded-pill inline-flex items-center justify-center gap-2 px-5 py-2.5 font-medium transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${VARIANTS[variant]} ${className}`}
    />
  );
}
