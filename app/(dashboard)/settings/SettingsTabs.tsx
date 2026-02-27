"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Gamepad2, Users } from "lucide-react";

interface SettingsTabsProps {
  gamesContent: React.ReactNode;
  operatorsContent: React.ReactNode;
}

export function SettingsTabs({ gamesContent, operatorsContent }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = React.useState<"games" | "operators">("games");

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-bg-tertiary rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("games")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === "games"
              ? "bg-bg-secondary text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          <Gamepad2 className="w-4 h-4" />
          Games
        </button>
        <button
          onClick={() => setActiveTab("operators")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === "operators"
              ? "bg-bg-secondary text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          <Users className="w-4 h-4" />
          Operators
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6">
        {activeTab === "games" && gamesContent}
        {activeTab === "operators" && operatorsContent}
      </div>
    </div>
  );
}
