import { Header } from "@/components/layout/Header";
import { getMonthlyReport, getAvailableMonths } from "./actions";
import { ReportDashboard } from "./ReportDashboard";

export default async function ReportsPage() {
  const [reportResult, monthsResult] = await Promise.all([
    getMonthlyReport(),
    getAvailableMonths(),
  ]);

  return (
    <>
      <Header title="MONTHLY REPORT" />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <ReportDashboard
            initialReport={reportResult.data}
            availableMonths={monthsResult.data || []}
          />
        </div>
      </div>
    </>
  );
}
