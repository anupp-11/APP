import { getATMWithdrawals, getATMEnabledAccounts } from "./actions";
import { ATMWithdrawalsList } from "./ATMWithdrawalsList";

export const dynamic = "force-dynamic";

export default async function ATMPage() {
  const [withdrawalsResult, accountsResult] = await Promise.all([
    getATMWithdrawals({ limit: 100 }),
    getATMEnabledAccounts(),
  ]);

  if (withdrawalsResult.error || accountsResult.error) {
    return (
      <div className="p-6">
        <div className="bg-withdraw/10 border border-withdraw rounded-lg p-4 text-withdraw">
          Error loading data: {withdrawalsResult.error || accountsResult.error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <ATMWithdrawalsList
        initialWithdrawals={withdrawalsResult.data || []}
        atmAccounts={accountsResult.data || []}
      />
    </div>
  );
}
