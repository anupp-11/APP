"use client";

import * as React from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  createPaymentPlatform,
  updatePaymentPlatform,
  deletePaymentPlatform,
  reactivatePaymentPlatform,
  type PlatformFull,
} from "./actions";
import { Plus, Pencil, Trash2, RotateCcw, X, CreditCard, ExternalLink } from "lucide-react";

// ============================================
// Format currency helper
// ============================================
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ============================================
// Platform Row Component
// ============================================

function PlatformRow({
  platform,
  onEdit,
}: {
  platform: PlatformFull;
  onEdit: (platform: PlatformFull) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  const handleDelete = () => {
    if (!confirm(`Deactivate "${platform.name}"? It will no longer appear in Quick Transaction.`)) {
      return;
    }
    startTransition(async () => {
      const result = await deletePaymentPlatform(platform.id);
      if (result.success) {
        success("Platform deactivated", `${platform.name} has been deactivated`);
      } else {
        error("Failed to deactivate", result.error);
      }
    });
  };

  const handleReactivate = () => {
    startTransition(async () => {
      const result = await reactivatePaymentPlatform(platform.id);
      if (result.success) {
        success("Platform reactivated", `${platform.name} is now active`);
      } else {
        error("Failed to reactivate", result.error);
      }
    });
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        platform.status === "inactive"
          ? "bg-bg-tertiary border-border opacity-60"
          : "bg-bg-secondary border-border hover:border-border-focus"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-center gap-3 flex-1">
          <CreditCard className="w-5 h-5 text-platform" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary">{platform.name}</span>
              {platform.status === "inactive" && (
                <Badge variant="inactive">Inactive</Badge>
              )}
            </div>
            {/* Links row */}
            <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
              {platform.depositUrl && (
                <a
                  href={platform.depositUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-deposit transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Deposit
                </a>
              )}
              {platform.withdrawUrl && (
                <a
                  href={platform.withdrawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-withdraw transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Withdraw
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="text-right mr-4">
          <span className="font-mono text-lg text-text-primary">{formatCurrency(platform.balance)}</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {platform.status === "active" ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(platform)}
                disabled={isPending}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
                className="text-withdraw hover:text-withdraw hover:bg-withdraw/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReactivate}
              disabled={isPending}
              className="text-deposit hover:text-deposit hover:bg-deposit/10"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reactivate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Platform Form (Create/Edit)
// ============================================

interface PlatformFormProps {
  platform?: PlatformFull;
  onClose: () => void;
}

function PlatformForm({ platform, onClose }: PlatformFormProps) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  const [name, setName] = React.useState(platform?.name ?? "");
  const [depositUrl, setDepositUrl] = React.useState(platform?.depositUrl ?? "");
  const [withdrawUrl, setWithdrawUrl] = React.useState(platform?.withdrawUrl ?? "");
  const [balance, setBalance] = React.useState(platform?.balance?.toString() ?? "0");

  const isEdit = !!platform;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      error("Validation Error", "Name is required");
      return;
    }

    const balanceNum = parseFloat(balance) || 0;

    startTransition(async () => {
      if (isEdit) {
        const result = await updatePaymentPlatform({
          id: platform.id,
          name: name.trim(),
          depositUrl: depositUrl.trim() || undefined,
          withdrawUrl: withdrawUrl.trim() || undefined,
          balance: balanceNum,
        });
        if (result.success) {
          success("Platform updated", `${name} has been updated`);
          onClose();
        } else {
          error("Failed to update", result.error);
        }
      } else {
        const result = await createPaymentPlatform({
          name: name.trim(),
          depositUrl: depositUrl.trim() || undefined,
          withdrawUrl: withdrawUrl.trim() || undefined,
          balance: balanceNum,
        });
        if (result.success) {
          success("Platform created", `${name} has been created`);
          onClose();
        } else {
          error("Failed to create", result.error);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">
            {isEdit ? "Edit Platform" : "New Payment Platform"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Name <span className="text-withdraw">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., PayPal, Venmo, Cash App"
            />
          </div>

          {/* Deposit URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Deposit Link
            </label>
            <Input
              value={depositUrl}
              onChange={(e) => setDepositUrl(e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>

          {/* Withdraw URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Withdrawal Link
            </label>
            <Input
              value={withdrawUrl}
              onChange={(e) => setWithdrawUrl(e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>

          {/* Balance */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Balance
            </label>
            <Input
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="deposit"
              className="flex-1"
              disabled={isPending}
            >
              {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Main Platforms List Component
// ============================================

interface PlatformsListProps {
  initialPlatforms: PlatformFull[];
}

export function PlatformsList({ initialPlatforms }: PlatformsListProps) {
  const [showForm, setShowForm] = React.useState(false);
  const [editingPlatform, setEditingPlatform] = React.useState<PlatformFull | undefined>();
  const [showInactive, setShowInactive] = React.useState(false);

  const activePlatforms = initialPlatforms.filter((p) => p.status === "active");
  const inactivePlatforms = initialPlatforms.filter((p) => p.status === "inactive");

  const handleEdit = (platform: PlatformFull) => {
    setEditingPlatform(platform);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingPlatform(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Active Platforms ({activePlatforms.length})
          </h2>
          <p className="text-sm text-text-secondary">
            Manage payment platform sources
          </p>
        </div>
        <Button variant="deposit" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Platform
        </Button>
      </div>

      {/* Active Platforms */}
      <div className="space-y-3">
        {activePlatforms.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            No active platforms. Click "Add Platform" to create one.
          </div>
        ) : (
          activePlatforms.map((platform) => (
            <PlatformRow key={platform.id} platform={platform} onEdit={handleEdit} />
          ))
        )}
      </div>

      {/* Inactive Platforms Toggle */}
      {inactivePlatforms.length > 0 && (
        <div className="pt-4 border-t border-border">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            {showInactive ? "Hide" : "Show"} inactive platforms ({inactivePlatforms.length})
          </button>

          {showInactive && (
            <div className="mt-4 space-y-3">
              {inactivePlatforms.map((platform) => (
                <PlatformRow key={platform.id} platform={platform} onEdit={handleEdit} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {showForm && <PlatformForm platform={editingPlatform} onClose={handleClose} />}
    </div>
  );
}
