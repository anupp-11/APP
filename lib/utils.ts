import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Get progress bar color based on percentage
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 95) return "bg-withdraw";
  if (percentage >= 80) return "bg-warning";
  return "bg-holding";
}

/**
 * Get progress bar background color based on percentage
 */
export function getProgressBgColor(percentage: number): string {
  if (percentage >= 95) return "bg-withdraw-bg";
  if (percentage >= 80) return "bg-warning-bg";
  return "bg-holding-bg";
}
