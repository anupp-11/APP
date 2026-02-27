"use client";

import * as React from "react";
import { ArrowLeft, Settings, User, LogOut } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getCurrentUserRole } from "@/lib/actions/auth";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backHref?: string;
}

export function Header({ title, showBackButton = false, backHref = "/" }: HeaderProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    getCurrentUserRole().then((role) => {
      setIsAdmin(role === "admin");
    });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-bg-primary/95 backdrop-blur-sm border-b border-border">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Link
              href={backHref}
              className={cn(
                "flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors",
                "-ml-2 px-2 py-1 rounded-md hover:bg-bg-tertiary"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
          )}
          <h1 className="text-xl font-bold text-text-primary">{title}</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/settings"
              className="w-10 h-10 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-full bg-holding-bg flex items-center justify-center text-holding hover:bg-holding/20 transition-colors"
            >
              <User className="w-5 h-5" />
            </button>
            
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-48 rounded-lg border border-border bg-bg-secondary shadow-lg py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
