"use client";

import { ReportsTable } from "@/components/reports-table";

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-4">
      <h1 className="text-3xl font-bold mb-6">Weighbridge Reports</h1>
      <ReportsTable />
    </div>
  );
}
