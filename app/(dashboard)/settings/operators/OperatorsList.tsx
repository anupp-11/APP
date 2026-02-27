"use client";

import * as React from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  createOperator,
  updateOperator,
  deleteOperator,
  reactivateOperator,
  type OperatorFull,
} from "./actions";
import { Plus, Pencil, Trash2, RotateCcw, X, UserCog, Shield, User } from "lucide-react";

// ============================================
// Operator Row Component
// ============================================

function OperatorRow({
  operator,
  onEdit,
  isBanned,
}: {
  operator: OperatorFull;
  onEdit: (operator: OperatorFull) => void;
  isBanned: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  const handleDelete = () => {
    if (!confirm(`Deactivate "${operator.name}"? They will no longer be able to log in.`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteOperator(operator.userId);
      if (result.success) {
        success("Operator deactivated", `${operator.name} has been deactivated`);
      } else {
        error("Failed to deactivate", result.error);
      }
    });
  };

  const handleReactivate = () => {
    startTransition(async () => {
      const result = await reactivateOperator(operator.userId);
      if (result.success) {
        success("Operator reactivated", `${operator.name} can now log in`);
      } else {
        error("Failed to reactivate", result.error);
      }
    });
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        isBanned
          ? "bg-bg-tertiary border-border opacity-60"
          : "bg-bg-secondary border-border hover:border-border-focus"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-center gap-3 flex-1">
          {operator.role === "admin" ? (
            <Shield className="w-5 h-5 text-withdraw" />
          ) : (
            <User className="w-5 h-5 text-holding" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary">{operator.name}</span>
              <Badge 
                variant={operator.role === "admin" ? "withdraw" : "holding"}
                className="uppercase text-xs"
              >
                {operator.role}
              </Badge>
              {isBanned && (
                <Badge variant="inactive">Inactive</Badge>
              )}
            </div>
            <p className="text-sm text-text-muted">{operator.email}</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {!isBanned ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(operator)}
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
// Operator Form (Create/Edit)
// ============================================

interface OperatorFormProps {
  operator?: OperatorFull;
  onClose: () => void;
}

function OperatorForm({ operator, onClose }: OperatorFormProps) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  const [name, setName] = React.useState(operator?.name ?? "");
  const [email, setEmail] = React.useState(operator?.email ?? "");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<"admin" | "operator">(operator?.role ?? "operator");

  const isEdit = !!operator;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      error("Validation Error", "Name is required");
      return;
    }
    if (!isEdit && !email.trim()) {
      error("Validation Error", "Email is required");
      return;
    }
    if (!isEdit && !password) {
      error("Validation Error", "Password is required");
      return;
    }
    if (!isEdit && password.length < 6) {
      error("Validation Error", "Password must be at least 6 characters");
      return;
    }

    startTransition(async () => {
      if (isEdit) {
        const result = await updateOperator({
          id: operator.id,
          userId: operator.userId,
          name: name.trim(),
          role,
          newPassword: password || undefined,
        });
        if (result.success) {
          success("Operator updated", `${name} has been updated`);
          onClose();
        } else {
          error("Failed to update", result.error);
        }
      } else {
        const result = await createOperator({
          email: email.trim(),
          password,
          name: name.trim(),
          role,
        });
        if (result.success) {
          success("Operator created", `${name} has been created`);
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
            {isEdit ? "Edit Operator" : "New Operator"}
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
              placeholder="e.g., John Doe"
            />
          </div>

          {/* Email (only for create) */}
          {!isEdit && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Email <span className="text-withdraw">*</span>
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@example.com"
              />
            </div>
          )}

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              {isEdit ? "New Password" : "Password"} {!isEdit && <span className="text-withdraw">*</span>}
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? "Leave blank to keep current" : "Min 6 characters"}
            />
            {isEdit && (
              <p className="text-xs text-text-muted">Leave blank to keep current password</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Role <span className="text-withdraw">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRole("operator")}
                className={cn(
                  "flex-1 p-3 rounded-lg border transition-all text-center",
                  role === "operator"
                    ? "border-holding bg-holding/10 text-holding"
                    : "border-border text-text-secondary hover:border-border-focus"
                )}
              >
                <User className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Operator</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={cn(
                  "flex-1 p-3 rounded-lg border transition-all text-center",
                  role === "admin"
                    ? "border-withdraw bg-withdraw/10 text-withdraw"
                    : "border-border text-text-secondary hover:border-border-focus"
                )}
              >
                <Shield className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Admin</span>
              </button>
            </div>
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
// Main Operators List Component
// ============================================

interface OperatorsListProps {
  initialOperators: OperatorFull[];
  bannedUserIds: string[];
}

export function OperatorsList({ initialOperators, bannedUserIds }: OperatorsListProps) {
  const [showForm, setShowForm] = React.useState(false);
  const [editingOperator, setEditingOperator] = React.useState<OperatorFull | undefined>();
  const [showInactive, setShowInactive] = React.useState(false);

  const bannedSet = new Set(bannedUserIds);
  const activeOperators = initialOperators.filter((o) => !bannedSet.has(o.userId));
  const inactiveOperators = initialOperators.filter((o) => bannedSet.has(o.userId));

  const handleEdit = (operator: OperatorFull) => {
    setEditingOperator(operator);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingOperator(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Operators ({activeOperators.length})
          </h2>
          <p className="text-sm text-text-secondary">
            Manage users who can create transactions
          </p>
        </div>
        <Button variant="deposit" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Operator
        </Button>
      </div>

      {/* Active Operators */}
      <div className="space-y-3">
        {activeOperators.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            No operators yet. Click "Add Operator" to create one.
          </div>
        ) : (
          activeOperators.map((operator) => (
            <OperatorRow 
              key={operator.id} 
              operator={operator} 
              onEdit={handleEdit}
              isBanned={false}
            />
          ))
        )}
      </div>

      {/* Inactive Operators Toggle */}
      {inactiveOperators.length > 0 && (
        <div className="pt-4 border-t border-border">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            {showInactive ? "Hide" : "Show"} inactive operators ({inactiveOperators.length})
          </button>

          {showInactive && (
            <div className="mt-4 space-y-3">
              {inactiveOperators.map((operator) => (
                <OperatorRow 
                  key={operator.id} 
                  operator={operator} 
                  onEdit={handleEdit}
                  isBanned={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {showForm && <OperatorForm operator={editingOperator} onClose={handleClose} />}
    </div>
  );
}
