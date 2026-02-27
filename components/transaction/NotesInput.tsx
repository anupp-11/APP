"use client";

import * as React from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotesInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function NotesInput({ value, onChange }: NotesInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors py-2"
        >
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              isOpen && "rotate-90"
            )}
          />
          <span>Add Notes (optional)</span>
        </button>
      </Collapsible.Trigger>
      
      <Collapsible.Content className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter any notes for this transaction..."
          rows={3}
          className={cn(
            "w-full mt-2 rounded-md border border-border bg-bg-tertiary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted",
            "focus:outline-none focus:ring-2 focus:ring-holding focus:ring-offset-2 focus:ring-offset-bg-primary focus:border-holding",
            "resize-none"
          )}
        />
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
