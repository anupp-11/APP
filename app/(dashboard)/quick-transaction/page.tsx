import { Header } from "@/components/layout/Header";
import { loadQuickTransactionData } from "./actions";
import { QuickTransactionForm } from "./QuickTransactionForm";
import { QuickTransactionSkeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export const revalidate = 0; // Always fetch fresh data

export default async function QuickTransactionPage() {
  const { data, error } = await loadQuickTransactionData();

  if (error || !data) {
    return (
      <>
        <Header title="QUICK TRANSACTION" />
        <div className="p-6">
          <div className="max-w-md mx-auto text-center space-y-4 py-12">
            <AlertCircle className="w-12 h-12 text-withdraw mx-auto" />
            <h2 className="text-xl font-semibold text-text-primary">
              Failed to load data
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
      <Header title="QUICK TRANSACTION" />
      <div className="p-6">
        <QuickTransactionForm initialData={data} />
      </div>
    </>
  );
}
