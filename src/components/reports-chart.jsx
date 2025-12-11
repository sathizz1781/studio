
"use client";

import React, { useState, useEffect } from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, startOfYear, endOfYear, subYears } from "date-fns";
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
                let startDate, records, processedData;

                switch (rangeType) {
                    case 'daily':
                        startDate = subDays(today, 6);
                        records = await fetchChartData(startDate, today, selectedWbNumber);
                        processedData = Array.from({ length: 7 }, (_, i) => {
                           const day = subDays(today, i);
                           return { name: format(day, "MMM d"), vehicles: 0, charges: 0 };
                        }).reverse();

                        records.forEach(record => {
                            const recordDate = new Date(record.date.split('/').reverse().join('-'));
                            const formattedDate = format(recordDate, "MMM d");
                            const dayData = processedData.find(d => d.name === formattedDate);
                            if (dayData) {
                                dayData.vehicles += 1;
                                dayData.charges += Number(record.charges) || 0;
                            }
                        });
                        setChartData(processedData);
                        break;
                    
                    case 'weekly':
                        startDate = startOfWeek(subWeeks(today, 3));
                        records = await fetchChartData(startDate, today, selectedWbNumber);
                        processedData = Array.from({ length: 4 }, (_, i) => {
                            const weekStart = startOfWeek(subWeeks(today, i));
                            return { 
                                name: `Week ${format(weekStart, 'w')}`, 
                                start: weekStart, 
                                end: endOfWeek(subWeeks(today, i)),
                                vehicles: 0, 
                                charges: 0 
                            };
                        }).reverse();

                        records.forEach(record => {
                            const recordDate = new Date(record.date.split('/').reverse().join('-'));
                            const weekData = processedData.find(w => recordDate >= w.start && recordDate <= w.end);
                            if (weekData) {
                                weekData.vehicles += 1;
                                weekData.charges += Number(record.charges) || 0;
                            }
                        });
                        setChartData(processedData);
                        break;

                    case 'monthly':
                        startDate = startOfMonth(subMonths(today, 5));
                        records = await fetchChartData(startDate, today, selectedWbNumber);
                        processedData = Array.from({ length: 6 }, (_, i) => {
                            const monthDate = subMonths(today, i);
                            return {
                                name: format(monthDate, "MMM yyyy"),
                                month: monthDate.getMonth(),
                                year: monthDate.getFullYear(),
                                vehicles: 0,
                                charges: 0
                            };
                        }).reverse();

                        records.forEach(record => {
                            const recordDate = new Date(record.date.split('/').reverse().join('-'));
                            const monthData = processedData.find(m => m.month === recordDate.getMonth() && m.year === recordDate.getFullYear());
                            if (monthData) {
                                monthData.vehicles += 1;
                                monthData.charges += Number(record.charges) || 0;
                            }
                        });
                        setChartData(processedData);
                        break;

                    case 'yearly':
                        startDate = startOfYear(subYears(today, 2));
                        records = await fetchChartData(startDate, today, selectedWbNumber);
                        processedData = Array.from({ length: 3 }, (_, i) => {
                            const yearDate = subYears(today, i);
                            return {
                                name: format(yearDate, "yyyy"),
                                year: yearDate.getFullYear(),
                                vehicles: 0,
                                charges: 0
                            };
                        }).reverse();

                        records.forEach(record => {
                            const recordDate = new Date(record.date.split('/').reverse().join('-'));
                            const yearData = processedData.find(y => y.year === recordDate.getFullYear());
                            if (yearData) {
                                yearData.vehicles += 1;
                                yearData.charges += Number(record.charges) || 0;
                            }
                        });
                        setChartData(processedData);
                        break;
                    
                    default:
                        setChartData([]);
                }


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
                        <CardDescription>A trend of weighbridge activity.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <div className="w-full sm:w-[220px]">
                            <Select onValueChange={setRangeType} value={rangeType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily (Last 7 Days)</SelectItem>
                                    <SelectItem value="weekly">Weekly (Last 4 Weeks)</SelectItem>
                                    <SelectItem value="monthly">Monthly (Last 6 Months)</SelectItem>
                                    <SelectItem value="yearly">Yearly (Last 3 Years)</SelectItem>
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
                                <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" label={{ value: 'Vehicles', angle: -90, position: 'insideLeft' }}/>
                                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" label={{ value: 'Charges (₹)', angle: -90, position: 'insideRight' }}/>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="vehicles" fill="hsl(var(--chart-1))" name="Vehicles"/>
                                <Bar yAxisId="right" dataKey="charges" fill="hsl(var(--chart-2))" name="Charges (₹)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

    