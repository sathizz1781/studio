"use client";

import { ReportsChart } from "@/components/reports-chart";
import { ReportsTable } from "@/components/reports-table";

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Weighbridge Dashboard</h1>
        <p className="text-muted-foreground">Daily comparison of vehicle entries and revenue.</p>
        <ReportsChart />
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-2">Records</h2>
        <p className="text-sm text-muted-foreground mb-4">Showing current date by default — use the filters to refine results.</p>
        <ReportsTable />
      </div>
    </div>
  );
}
