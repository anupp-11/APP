import { loadPlayerCredits } from "./actions";
import { CreditsList } from "./CreditsList";

export default async function CreditsPage() {
  const { data: credits, error } = await loadPlayerCredits();

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Credits</h1>
        <div className="text-withdraw">Error loading credits: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Credits</h1>
      <CreditsList initialCredits={credits || []} />
    </div>
  );
}
