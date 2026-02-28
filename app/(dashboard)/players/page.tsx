import { Header } from "@/components/layout/Header";
import { loadPlayers } from "./actions";
import { PlayersList } from "./PlayersList";

export default async function PlayersPage() {
  const { data: players, error } = await loadPlayers();

  return (
    <>
      <Header title="PLAYERS" />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {error ? (
            <div className="text-center py-12 text-withdraw">
              Error loading players: {error}
            </div>
          ) : (
            <PlayersList initialPlayers={players || []} />
          )}
        </div>
      </div>
    </>
  );
}
