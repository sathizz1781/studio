"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format, subDays } from "date-fns";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAppContext } from "@/app/layout";

async function fetchRecordsForDay(date, wb_number) {
    if (!wb_number || !date) return [];
    const query = {
        startDate: format(date, "dd/MM/yyyy"),
        endDate: format(date, "dd/MM/yyyy"),
        wb_number,
    };

    const response = await fetch("https://bend-mqjz.onrender.com/api/wb/getrecords", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch data for date: ${query.startDate}`);
    }

    const result = await response.json();
    return result.records || [];
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border p-2 rounded-lg shadow-lg">
        <p className="font-bold">{label}</p>
        <p className="text-sm" style={{ color: "hsl(var(--chart-1))" }}>{`Vehicles: ${payload[0].value}`}</p>
        <p className="text-sm" style={{ color: "hsl(var(--chart-2))" }}>{`Charges: ₹${(payload[1].value || 0).toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};

export function ReportsChart() {
    const { user, entities, wb_number } = useAppContext();
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
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
            try {
                const today = new Date();
                const yesterday = subDays(today, 1);

                const [todayRecords, yesterdayRecords] = await Promise.all([
                    fetchRecordsForDay(today, selectedWbNumber),
                    fetchRecordsForDay(yesterday, selectedWbNumber),
                ]);

                const processRecords = (records) => {
                    return records.reduce((acc, record) => {
                        acc.vehicles += 1;
                        acc.charges += Number(record.charges) || 0;
                        return acc;
                    }, { vehicles: 0, charges: 0 });
                };

                const todayData = processRecords(todayRecords);
                const yesterdayData = processRecords(yesterdayRecords);

                setChartData([
                    { name: 'Today', vehicles: todayData.vehicles, charges: todayData.charges },
                    { name: 'Yesterday', vehicles: yesterdayData.vehicles, charges: yesterdayData.charges },
                ]);

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
    }, [toast, selectedWbNumber]);
    
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
                           <Select defaultValue="daily" disabled>
                                <SelectTrigger>
                                    <SelectValue placeholder="Daily Comparison" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily Comparison</SelectItem>
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
                        <p className="text-muted-foreground">No records found for today or yesterday.</p>
                    </div>
                ) : (
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" label={{ value: 'Vehicles', angle: -90, position: 'insideLeft' }}/>
                                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" label={{ value: 'Charges (₹)', angle: -90, position: 'insideRight' }}/>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" wrapperStyle={{ paddingBottom: '10px' }} />
                                <Bar yAxisId="left" dataKey="vehicles" fill="hsl(var(--chart-1))" name="Vehicles" />
                                <Bar yAxisId="right" dataKey="charges" fill="hsl(var(--chart-2))" name="Charges (₹)" />
                           </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
