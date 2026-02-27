"use client";

import * as React from "react";
import { SourceCard } from "./SourceCard";
import type { TransactionSource } from "@/lib/types";

interface SourceGridProps {
  sources: TransactionSource[];
  selectedSourceId: string | null;
  onSelectSource: (sourceId: string) => void;
}

export function SourceGrid({
  sources,
  selectedSourceId,
  onSelectSource,
}: SourceGridProps) {
  // Separate active and inactive sources, with active first
  const sortedSources = React.useMemo(() => {
    return [...sources].sort((a, b) => {
      // Active sources first
      if (a.status === "active" && b.status === "inactive") return -1;
      if (a.status === "inactive" && b.status === "active") return 1;
      
      // Then by source type (chime first)
      if (a.sourceType === "chime" && b.sourceType === "platform") return -1;
      if (a.sourceType === "platform" && b.sourceType === "chime") return 1;
      
      return 0;
    });
  }, [sources]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sortedSources.map((source) => (
        <SourceCard
          key={source.id}
          source={source}
          isSelected={selectedSourceId === source.id}
          onSelect={() => onSelectSource(source.id)}
        />
      ))}
    </div>
  );
}
