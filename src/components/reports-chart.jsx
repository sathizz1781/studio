"use client";

import React, { useState, useEffect } from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
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

async function fetchChartData(startDate, endDate, wb_number) {
    if (!wb_number || !startDate || !endDate) return [];
    const query = {
        // The API expects dd/MM/yyyy
        startDate: format(startDate, "dd/MM/yyyy"),
        endDate: format(endDate, "dd/MM/yyyy"),
        wb_number,
    };

    const response = await fetch("https://bend-mqjz.onrender.com/api/wb/getrecords", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch data for range: ${query.startDate} - ${query.endDate}`);
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
        <p className="text-sm" style={{ color: "hsl(var(--chart-2))" }}>{`Charges: ₹${payload[1].value.toLocaleString()}`}</p>
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
    const [rangeType, setRangeType] = useState("daily");

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
                let startDate, endDate, records, prevStartDate, prevEndDate, prevRecords;

                switch (rangeType) {
                    case 'daily':
                        startDate = subDays(today, 0); // Today
                        endDate = today;
                        prevStartDate = subDays(today, 1); // Yesterday
                        prevEndDate = subDays(today, 1);
                        break;
                    case 'weekly':
                        startDate = startOfWeek(today);
                        endDate = endOfWeek(today);
                        prevStartDate = startOfWeek(subDays(today, 7));
                        prevEndDate = endOfWeek(subDays(today, 7));
                        break;
                    case 'monthly':
                        startDate = startOfMonth(today);
                        endDate = endOfMonth(today);
                        prevStartDate = startOfMonth(subDays(today, 30));
                        prevEndDate = endOfMonth(subDays(today, 30));
                        break;
                    default:
                        setChartData([]);
                        setIsLoading(false);
                        return;
                }
                
                [records, prevRecords] = await Promise.all([
                    fetchChartData(startDate, endDate, selectedWbNumber),
                    fetchChartData(prevStartDate, prevEndDate, selectedWbNumber)
                ]);

                const currentPeriodData = {
                    name: rangeType === 'daily' ? 'Today' : rangeType === 'weekly' ? 'This Week' : 'This Month',
                    vehicles: records.length,
                    charges: records.reduce((acc, rec) => acc + (Number(rec.charges) || 0), 0)
                };

                const previousPeriodData = {
                    name: rangeType === 'daily' ? 'Yesterday' : rangeType === 'weekly' ? 'Last Week' : 'Last Month',
                    vehicles: prevRecords.length,
                    charges: prevRecords.reduce((acc, rec) => acc + (Number(rec.charges) || 0), 0)
                };

                setChartData([currentPeriodData, previousPeriodData]);

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
    }, [toast, selectedWbNumber, rangeType]);
    
    return (
        <Card className="mt-6">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <CardTitle>Activity Overview</CardTitle>
                        <CardDescription>A comparison of weighbridge activity.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <div className="w-full sm:w-[200px]">
                            <Select onValueChange={setRangeType} defaultValue="daily">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily Comparison</SelectItem>
                                    <SelectItem value="weekly">Weekly Comparison</SelectItem>
                                    <SelectItem value="monthly">Monthly Comparison</SelectItem>
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
                    <div className="h-[350px] w-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !selectedWbNumber ? (
                    <div className="h-[350px] w-full flex items-center justify-center">
                        <p className="text-muted-foreground">
                            {user?.role === 'developer' ? "Please select an entity to view their chart." : "No data to display."}
                        </p>
                    </div>
                ) : (
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Vehicles', angle: -90, position: 'insideLeft' }}/>
                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'Charges (₹)', angle: -90, position: 'insideRight' }}/>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="vehicles" fill="#8884d8" name="Vehicles"/>
                                <Bar yAxisId="right" dataKey="charges" fill="#82ca9d" name="Charges (₹)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
