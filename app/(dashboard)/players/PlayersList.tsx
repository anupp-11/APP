"use client";

import * as React from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { 
  createPlayer, 
  updatePlayer, 
  deletePlayer,
  loadPlayers,
  Player 
} from "./actions";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Search, 
  ExternalLink,
  Facebook
} from "lucide-react";

// ============================================
// Player Table Row Component
// ============================================

function PlayerTableRow({
  player,
  onEdit,
  onRefresh,
}: {
  player: Player;
  onEdit: (player: Player) => void;
  onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  const handleDelete = () => {
    if (!confirm(`Delete player "${player.name}"?`)) return;

    startTransition(async () => {
      const result = await deletePlayer(player.id);
      if (result.success) {
        success("Player deleted", `${player.name} has been removed`);
        onRefresh();
      } else {
        error("Failed to delete", result.error || "Unknown error");
      }
    });
  };

  return (
    <tr className={cn(
      "border-b border-border hover:bg-bg-tertiary/50 transition-colors",
      isPending && "opacity-50"
    )}>
      <td className="py-3 px-4 font-medium text-text-primary">
        {player.name}
      </td>
      <td className="py-3 px-4 text-text-secondary">
        {player.friendOn || "-"}
      </td>
      <td className="py-3 px-4">
        {player.fbLink ? (
          <a
            href={player.fbLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-holding hover:text-holding/80 transition-colors"
          >
            <Facebook className="w-3 h-3" />
            Facebook
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-text-muted">-</span>
        )}
      </td>
      <td className="py-3 px-4 text-text-secondary text-sm max-w-[200px] truncate">
        {player.notes || "-"}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(player)}
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
        </div>
      </td>
    </tr>
  );
}

// ============================================
// Player Form Modal
// ============================================

function PlayerForm({
  player,
  onClose,
  onRefresh,
}: {
  player: Player | null;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  const [name, setName] = React.useState(player?.name ?? "");
  const [fbLink, setFbLink] = React.useState(player?.fbLink ?? "");
  const [friendOn, setFriendOn] = React.useState(player?.friendOn ?? "");
  const [notes, setNotes] = React.useState(player?.notes ?? "");

  const isEdit = !!player;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      error("Validation Error", "Name is required");
      return;
    }

    startTransition(async () => {
      if (isEdit) {
        const result = await updatePlayer({
          id: player.id,
          name: name.trim(),
          fbLink: fbLink.trim() || undefined,
          friendOn: friendOn.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        if (result.success) {
          success("Player updated", `${name} has been updated`);
          onRefresh();
          onClose();
        } else {
          error("Failed to update", result.error || "Unknown error");
        }
      } else {
        const result = await createPlayer({
          name: name.trim(),
          fbLink: fbLink.trim() || undefined,
          friendOn: friendOn.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        if (result.success) {
          success("Player added", `${name} has been added`);
          onRefresh();
          onClose();
        } else {
          error("Failed to add", result.error || "Unknown error");
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">
            {isEdit ? "Edit Player" : "Add Player"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Name <span className="text-withdraw">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Player name"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Facebook Link
            </label>
            <Input
              value={fbLink}
              onChange={(e) => setFbLink(e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Friend On (FB Account Name)
            </label>
            <Input
              value={friendOn}
              onChange={(e) => setFriendOn(e.target.value)}
              placeholder="Name of your FB account"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Notes
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? "Saving..." : isEdit ? "Update" : "Add Player"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Players List Component
// ============================================

interface PlayersListProps {
  initialPlayers: Player[];
}

export function PlayersList({ initialPlayers }: PlayersListProps) {
  const [players, setPlayers] = React.useState(initialPlayers);
  const [search, setSearch] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [editingPlayer, setEditingPlayer] = React.useState<Player | null>(null);

  // Refresh players from server
  const refreshPlayers = React.useCallback(async () => {
    const result = await loadPlayers();
    if (result.data && !result.error) {
      setPlayers(result.data);
    }
  }, []);

  // Filter players based on search
  const filteredPlayers = React.useMemo(() => {
    if (!search) return players;
    const lowerSearch = search.toLowerCase();
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerSearch) ||
        p.friendOn?.toLowerCase().includes(lowerSearch) ||
        p.notes?.toLowerCase().includes(lowerSearch)
    );
  }, [players, search]);

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPlayer(null);
  };

  return (
    <div>
      {/* Header with search and add button */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Player
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-4 text-sm text-text-muted">
        {filteredPlayers.length} player{filteredPlayers.length !== 1 ? "s" : ""}
        {search && ` matching "${search}"`}
      </div>

      {/* Players Table */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          {search ? "No players match your search" : "No players yet. Add your first player!"}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">Name</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">Friend On</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">Facebook</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">Notes</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <PlayerTableRow
                  key={player.id}
                  player={player}
                  onEdit={handleEdit}
                  onRefresh={refreshPlayers}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <PlayerForm
          player={editingPlayer}
          onClose={handleCloseForm}
          onRefresh={refreshPlayers}
        />
      )}
    </div>
  );
}
