import { Header } from "@/components/layout/Header";
import { loadGames } from "./games/actions";
import { loadOperators } from "./operators/actions";
import { GamesList } from "./games/GamesList";
import { OperatorsList } from "./operators/OperatorsList";
import { AlertCircle } from "lucide-react";
import { SettingsTabs } from "./SettingsTabs";
import { createAdminClient } from "@/lib/supabase/server";

export const revalidate = 0;

async function getBannedUserIds(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data: users } = await supabase.auth.admin.listUsers();
  
  if (!users?.users) return [];
  
  return users.users
    .filter((u) => u.banned_until && new Date(u.banned_until) > new Date())
    .map((u) => u.id);
}

export default async function SettingsPage() {
  const [gamesResult, operatorsResult, bannedUserIds] = await Promise.all([
    loadGames(),
    loadOperators(),
    getBannedUserIds(),
  ]);

  const hasGamesError = gamesResult.error || !gamesResult.data;
  const hasOperatorsError = operatorsResult.error || !operatorsResult.data;

  if (hasGamesError && hasOperatorsError) {
    return (
      <>
        <Header title="SETTINGS" />
        <div className="p-6">
          <div className="max-w-md mx-auto text-center space-y-4 py-12">
            <AlertCircle className="w-12 h-12 text-withdraw mx-auto" />
            <h2 className="text-xl font-semibold text-text-primary">
              Failed to load settings
            </h2>
            <p className="text-text-secondary">
              {gamesResult.error || operatorsResult.error || "Unable to connect to the database."}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="SETTINGS" />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <SettingsTabs
            gamesContent={
              hasGamesError ? (
                <div className="text-center py-8 text-text-muted">
                  Failed to load games: {gamesResult.error}
                </div>
              ) : (
                <GamesList initialGames={gamesResult.data!} />
              )
            }
            operatorsContent={
              hasOperatorsError ? (
                <div className="text-center py-8 text-text-muted">
                  Failed to load operators: {operatorsResult.error}
                </div>
              ) : (
                <OperatorsList 
                  initialOperators={operatorsResult.data!} 
                  bannedUserIds={bannedUserIds}
                />
              )
            }
          />
        </div>
      </div>
    </>
  );
}
