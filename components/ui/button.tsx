import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-semibold transition-base focus-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-holding text-white hover:bg-holding/90",
        deposit: "bg-deposit text-white hover:bg-deposit/90",
        withdraw: "bg-withdraw text-white hover:bg-withdraw/90",
        outline: "border border-border bg-transparent text-text-primary hover:bg-bg-tertiary",
        ghost: "text-text-primary hover:bg-bg-tertiary",
        secondary: "bg-bg-tertiary text-text-primary hover:bg-bg-secondary",
      },
      size: {
        default: "h-11 px-4 text-sm rounded-md",
        sm: "h-9 px-3 text-sm rounded-md",
        lg: "h-14 px-8 text-base rounded-lg",
        icon: "h-10 w-10 rounded-md",
        quick: "h-11 min-w-16 px-3 text-base rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
