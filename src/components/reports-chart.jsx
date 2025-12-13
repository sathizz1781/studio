"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format, subDays, startOfWeek, startOfMonth, startOfYear, parse, getWeek, getYear } from "date-fns";
import { ComposedChart, Bar, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAppContext } from "@/app/layout";

// Helper to parse dd/MM/yyyy dates safely
const parseDateString = (dateString) => {
  return parse(dateString, "dd/MM/yyyy", new Date());
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border p-2 rounded-lg shadow-lg text-xs">
        <p className="font-bold">{label}</p>
        <p className="text-sm" style={{ color: "hsl(var(--chart-1))" }}>{`Vehicles: ${payload.find(p => p.dataKey === 'vehicles')?.value || 0}`}</p>
        <p className="text-sm" style={{ color: "hsl(var(--chart-2))" }}>{`Charges: ₹${(payload.find(p => p.dataKey === 'charges')?.value || 0).toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};

export function ReportsChart() {
    const { user, entities, wb_number } = useAppContext();
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState("daily");
    const { toast } = useToast();
    const [selectedWbNumber, setSelectedWbNumber] = useState(wb_number || "");

    useEffect(() => {
        if(user?.role === 'entity' && wb_number) {
            setSelectedWbNumber(wb_number);
        } else if (user?.role === 'developer' && entities && entities.length > 0) {
            if (!selectedWbNumber) {
                setSelectedWbNumber(entities[0].mobileNumber);
            }
        }
    }, [wb_number, user?.role, entities, selectedWbNumber]);
    
    useEffect(() => {
        const getChartData = async () => {
            if (!selectedWbNumber) {
                setChartData([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const today = new Date();
            let startDate;
            let endDate = today;

            switch (view) {
                case "daily":
                    startDate = subDays(today, 6);
                    break;
                case "last30days":
                    startDate = subDays(today, 29);
                    break;
                case "weekly":
                    startDate = subDays(startOfWeek(today, { weekStartsOn: 1 }), 21); // Start of week, 4 weeks ago including current
                    break;
                case "monthly":
                    startDate = startOfYear(today);
                    break;
                case "yearly":
                    startDate = startOfYear(subDays(today, 365 * 2));
                    break;
                default:
                    startDate = subDays(today, 6);
            }

            try {
                const query = {
                    startDate: format(startDate, "dd/MM/yyyy"),
                    endDate: format(endDate, "dd/MM/yyyy"),
                    wb_number: selectedWbNumber,
                };
                const response = await fetch("https://bend-mqjz.onrender.com/api/wb/getrecords", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(query)
                });
                if (!response.ok) throw new Error("Failed to fetch records");
                const result = await response.json();
                const records = result.records || [];

                const dataMap = new Map();

                if (view === "daily") {
                    for (let i = 0; i < 7; i++) {
                        const date = subDays(today, i);
                        const key = format(date, "yyyy-MM-dd");
                        dataMap.set(key, { name: format(date, "MMM d"), vehicles: 0, charges: 0, date: date });
                    }
                    records.forEach(rec => {
                        const date = parseDateString(rec.date);
                        const key = format(date, "yyyy-MM-dd");
                        if (dataMap.has(key)) {
                            const entry = dataMap.get(key);
                            entry.vehicles += 1;
                            entry.charges += Number(rec.charges) || 0;
                        }
                    });
                } else if (view === "last30days") {
                    for (let i = 0; i < 30; i++) {
                        const date = subDays(today, i);
                        const key = format(date, "yyyy-MM-dd");
                        dataMap.set(key, { name: format(date, "MMM d"), vehicles: 0, charges: 0, date: date });
                    }
                    records.forEach(rec => {
                        const date = parseDateString(rec.date);
                        const key = format(date, "yyyy-MM-dd");
                        if (dataMap.has(key)) {
                            const entry = dataMap.get(key);
                            entry.vehicles += 1;
                            entry.charges += Number(rec.charges) || 0;
                        }
                    });
                } else if (view === "weekly") {
                    for (let i = 0; i < 4; i++) {
                        const weekStartDate = startOfWeek(subDays(today, i * 7), { weekStartsOn: 1 });
                        const key = `${getYear(weekStartDate)}-${getWeek(weekStartDate, { weekStartsOn: 1 })}`;
                        dataMap.set(key, { name: `Week ${getWeek(weekStartDate, { weekStartsOn: 1 })}`, vehicles: 0, charges: 0, date: weekStartDate });
                    }
                     records.forEach(rec => {
                        const date = parseDateString(rec.date);
                        const key = `${getYear(date)}-${getWeek(date, { weekStartsOn: 1 })}`;
                         if (dataMap.has(key)) {
                            const entry = dataMap.get(key);
                            entry.vehicles += 1;
                            entry.charges += Number(rec.charges) || 0;
                        }
                    });
                } else if (view === "monthly") {
                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    for (let i = 0; i < 12; i++) {
                       dataMap.set(i, { name: monthNames[i], vehicles: 0, charges: 0, month: i });
                    }
                     records.forEach(rec => {
                        const month = parseDateString(rec.date).getMonth();
                        if (dataMap.has(month)) {
                            const entry = dataMap.get(month);
                            entry.vehicles += 1;
                            entry.charges += Number(rec.charges) || 0;
                        }
                    });
                } else if (view === "yearly") {
                    for (let i = 0; i < 3; i++) {
                       const year = getYear(today) - i;
                       dataMap.set(year, { name: year.toString(), vehicles: 0, charges: 0, year: year });
                    }
                    records.forEach(rec => {
                        const year = parseDateString(rec.date).getFullYear();
                        if (dataMap.has(year)) {
                            const entry = dataMap.get(year);
                            entry.vehicles += 1;
                            entry.charges += Number(rec.charges) || 0;
                        }
                    });
                }
                
                let processedData = Array.from(dataMap.values());

                if (view === 'daily' || view === 'last30days') processedData.sort((a,b) => a.date - b.date);
                if (view === 'weekly') processedData.sort((a,b) => a.date - b.date);
                if (view === 'monthly') processedData.sort((a,b) => a.month - b.month);
                if (view === 'yearly') processedData.sort((a,b) => b.year - a.year);


                setChartData(processedData);

            } catch (error) {
                console.error("Failed to load chart data:", error);
                toast({
                    variant: "destructive",
                    title: "Chart Error",
                    description: "Could not load comparison chart.",
                });
                setChartData([]);
            } finally {
                setIsLoading(false);
            }
        };

        getChartData();
    }, [toast, selectedWbNumber, view]);
    
    return (
        <Card className="mt-6">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <CardTitle>Activity Overview</CardTitle>
                        <CardDescription>A comparison of weighbridge activity.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <div className="w-full sm:w-[220px]">
                           <Select value={view} onValueChange={setView}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a view" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">This Week (Daily)</SelectItem>
                                    <SelectItem value="last30days">Last 30 Days (Daily)</SelectItem>
                                    <SelectItem value="weekly">Last 4 Weeks</SelectItem>
                                    <SelectItem value="monthly">This Year (Monthly)</SelectItem>
                                    <SelectItem value="yearly">Last 3 Years</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {user?.role === 'developer' && entities && entities.length > 0 && (
                            <div className="w-full sm:w-auto sm:min-w-[200px]">
                                <Select onValueChange={setSelectedWbNumber} value={selectedWbNumber}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an entity..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {entities.map(entity => (
                                            <SelectItem key={entity._id} value={entity.mobileNumber}>
                                                {entity.companyName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[400px] w-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !selectedWbNumber ? (
                    <div className="h-[400px] w-full flex items-center justify-center">
                        <p className="text-muted-foreground">
                            {user?.role === 'developer' ? "Please select an entity to view their chart." : "No data to display."}
                        </p>
                    </div>
                ) : chartData.length === 0 ? (
                     <div className="h-[400px] w-full flex items-center justify-center">
                        <p className="text-muted-foreground">No records found for this period.</p>
                    </div>
                ) : (
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Vehicles', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}/>
                                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Charges (₹)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}/>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} />
                                <Bar yAxisId="left" dataKey="vehicles" fill="hsl(var(--chart-1))" name="Vehicles" barSize={20} />
                                <Line yAxisId="right" type="monotone" dataKey="charges" stroke="hsl(var(--chart-2))" name="Charges (₹)" />
                           </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}