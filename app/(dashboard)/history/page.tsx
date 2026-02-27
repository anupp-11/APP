import { Header } from "@/components/layout/Header";
import { getTransactions, getFilterOptions } from "./actions";
import { TransactionList } from "./TransactionList";

export default async function HistoryPage() {
  const [transactionsResult, filterOptions] = await Promise.all([
    getTransactions({ limit: 25 }),
    getFilterOptions(),
  ]);

  return (
    <>
      <Header title="TRANSACTION HISTORY" />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <TransactionList
            initialTransactions={transactionsResult.data || []}
            initialTotal={transactionsResult.total}
            filterOptions={filterOptions}
          />
        </div>
      </div>
    </>
  );
}
