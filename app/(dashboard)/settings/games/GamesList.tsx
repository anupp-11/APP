"use client";

import * as React from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  createGame,
  updateGame,
  deleteGame,
  reactivateGame,
  type GameFull,
} from "./actions";
import { Plus, Pencil, Trash2, RotateCcw, X, Gamepad2 } from "lucide-react";

// ============================================
// Game Row Component
// ============================================

function GameRow({
  game,
  onEdit,
}: {
  game: GameFull;
  onEdit: (game: GameFull) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  const handleDelete = () => {
    if (!confirm(`Deactivate "${game.name}"? It will no longer appear in Quick Transaction.`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteGame(game.id);
      if (result.success) {
        success("Game deactivated", `${game.name} has been deactivated`);
      } else {
        error("Failed to deactivate", result.error);
      }
    });
  };

  const handleReactivate = () => {
    startTransition(async () => {
      const result = await reactivateGame(game.id);
      if (result.success) {
        success("Game reactivated", `${game.name} is now active`);
      } else {
        error("Failed to reactivate", result.error);
      }
    });
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        game.status === "inactive"
          ? "bg-bg-tertiary border-border opacity-60"
          : "bg-bg-secondary border-border hover:border-border-focus"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-center gap-3 flex-1">
          <Gamepad2 className="w-5 h-5 text-holding" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary">{game.name}</span>
              <Badge variant="default" className="font-mono text-xs">{game.tag}</Badge>
              {game.status === "inactive" && (
                <Badge variant="inactive">Inactive</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {game.status === "active" ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(game)}
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
// Game Form (Create/Edit)
// ============================================

interface GameFormProps {
  game?: GameFull;
  onClose: () => void;
}

function GameForm({ game, onClose }: GameFormProps) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  const [name, setName] = React.useState(game?.name ?? "");
  const [tag, setTag] = React.useState(game?.tag ?? "");

  const isEdit = !!game;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      error("Validation Error", "Name is required");
      return;
    }
    if (!tag.trim()) {
      error("Validation Error", "Tag is required");
      return;
    }

    startTransition(async () => {
      if (isEdit) {
        const result = await updateGame({
          id: game.id,
          name: name.trim(),
          tag: tag.trim(),
        });
        if (result.success) {
          success("Game updated", `${name} has been updated`);
          onClose();
        } else {
          error("Failed to update", result.error);
        }
      } else {
        const result = await createGame({
          name: name.trim(),
          tag: tag.trim(),
        });
        if (result.success) {
          success("Game created", `${name} has been created`);
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
            {isEdit ? "Edit Game" : "New Game"}
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
              placeholder="e.g., Slots Paradise, Poker Pro"
            />
          </div>

          {/* Tag */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Tag <span className="text-withdraw">*</span>
            </label>
            <Input
              value={tag}
              onChange={(e) => setTag(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
              placeholder="e.g., slots_paradise"
            />
            <p className="text-xs text-text-muted">Unique identifier (lowercase, underscores)</p>
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
// Main Games List Component
// ============================================

interface GamesListProps {
  initialGames: GameFull[];
}

export function GamesList({ initialGames }: GamesListProps) {
  const [showForm, setShowForm] = React.useState(false);
  const [editingGame, setEditingGame] = React.useState<GameFull | undefined>();
  const [showInactive, setShowInactive] = React.useState(false);

  const activeGames = initialGames.filter((g) => g.status === "active");
  const inactiveGames = initialGames.filter((g) => g.status === "inactive");

  const handleEdit = (game: GameFull) => {
    setEditingGame(game);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingGame(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Games ({activeGames.length})
          </h2>
          <p className="text-sm text-text-secondary">
            Manage games for transactions
          </p>
        </div>
        <Button variant="deposit" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Game
        </Button>
      </div>

      {/* Active Games */}
      <div className="space-y-3">
        {activeGames.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            No games yet. Click "Add Game" to create one.
          </div>
        ) : (
          activeGames.map((game) => (
            <GameRow key={game.id} game={game} onEdit={handleEdit} />
          ))
        )}
      </div>

      {/* Inactive Games Toggle */}
      {inactiveGames.length > 0 && (
        <div className="pt-4 border-t border-border">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            {showInactive ? "Hide" : "Show"} inactive games ({inactiveGames.length})
          </button>

          {showInactive && (
            <div className="mt-4 space-y-3">
              {inactiveGames.map((game) => (
                <GameRow key={game.id} game={game} onEdit={handleEdit} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {showForm && <GameForm game={editingGame} onClose={handleClose} />}
    </div>
  );
}
