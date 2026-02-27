import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md border bg-bg-tertiary px-4 py-3 text-base text-text-primary placeholder:text-text-muted transition-base",
          "focus:outline-none focus:ring-2 focus:ring-holding focus:ring-offset-2 focus:ring-offset-bg-primary focus:border-holding",
          error && "border-withdraw focus:ring-withdraw focus:border-withdraw",
          !error && "border-border",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
