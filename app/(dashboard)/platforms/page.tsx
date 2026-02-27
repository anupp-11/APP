import { Header } from "@/components/layout/Header";
import { loadPaymentPlatforms } from "./actions";
import { PlatformsList } from "./PlatformsList";
import { AlertCircle } from "lucide-react";

export const revalidate = 0;

export default async function PlatformsPage() {
  const { data, error } = await loadPaymentPlatforms();

  if (error || !data) {
    return (
      <>
        <Header title="PAYMENT PLATFORMS" />
        <div className="p-6">
          <div className="max-w-md mx-auto text-center space-y-4 py-12">
            <AlertCircle className="w-12 h-12 text-withdraw mx-auto" />
            <h2 className="text-xl font-semibold text-text-primary">
              Failed to load platforms
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
      <Header title="PAYMENT PLATFORMS" />
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <PlatformsList initialPlatforms={data} />
        </div>
      </div>
    </>
  );
}
