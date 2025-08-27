
"use client";

import { ReportsTable } from "@/components/reports-table";
import { ReportsChart } from "@/components/reports-chart";

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Weighbridge Dashboard</h1>
        <p className="text-muted-foreground">Daily comparison of vehicle entries and revenue.</p>
        <ReportsChart />
      </div>
      <div>
        <h2 className="text-3xl font-bold mb-6">Weighbridge Reports</h2>
        <ReportsTable />
      </div>
    </div>
  );
}
