import { Header } from "@/components/layout/Header";
import { loadChimeAccounts } from "./actions";
import { AccountsList } from "./AccountsList";
import { AlertCircle } from "lucide-react";

export const revalidate = 0;

export default async function AccountsPage() {
  const { data, error } = await loadChimeAccounts();

  if (error || !data) {
    return (
      <>
        <Header title="CHIME ACCOUNTS" />
        <div className="p-6">
          <div className="max-w-md mx-auto text-center space-y-4 py-12">
            <AlertCircle className="w-12 h-12 text-withdraw mx-auto" />
            <h2 className="text-xl font-semibold text-text-primary">
              Failed to load accounts
            </h2>
            <p className="text-text-secondary">
              {error || "Unable to connect to the database. Please try again."}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="CHIME ACCOUNTS" />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <AccountsList initialAccounts={data} />
        </div>
      </div>
    </>
  );
}
