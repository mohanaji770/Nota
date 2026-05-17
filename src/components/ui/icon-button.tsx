import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  active?: boolean;
};

export function IconButton({ label, active, className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={props.disabled}
      className={cn(
        "touch-target focus-ring inline-grid place-items-center rounded-full text-ink-700 transition duration-200 ease-material active:scale-95 disabled:pointer-events-none disabled:opacity-28 dark:text-ink-100",
        active && "bg-leaf-100 text-leaf-700 dark:bg-leaf-700/30 dark:text-leaf-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
