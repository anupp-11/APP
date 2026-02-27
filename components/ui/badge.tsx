import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide rounded",
  {
    variants: {
      variant: {
        default: "bg-bg-tertiary text-text-secondary",
        holding: "bg-holding-bg text-holding",
        paying: "bg-paying-bg text-paying",
        platform: "bg-platform-bg text-platform",
        active: "bg-deposit-bg text-deposit",
        inactive: "bg-bg-tertiary text-text-muted",
        warning: "bg-warning-bg text-warning",
        deposit: "bg-deposit-bg text-deposit",
        withdraw: "bg-withdraw-bg text-withdraw",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
