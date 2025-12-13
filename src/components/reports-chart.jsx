
"use client";

import React, { useState, useEffect } from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getISOWeek, getMonth, getYear, subMonths, subYears, startOfYear, endOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachYearOfInterval, isWithinInterval } from "date-fns";
import { Line, Bar, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
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

const ChartComponent = ({ data }) => {
    return (
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" />
            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="vehicles" fill="hsl(var(--chart-1))" name="Vehicles" />
            <Line yAxisId="right" type="monotone" dataKey="charges" stroke="hsl(var(--chart-2))" name="Charges (₹)" />
        </ComposedChart>
    );
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

    // Helper function to parse 'dd/MM/yyyy' dates from the API
    const parseApiDate = (dateString) => {
        if (!dateString) return null;
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            // new Date(year, monthIndex, day)
            return new Date(Number(year), Number(month) - 1, Number(day));
        }
        return null; // Invalid format
    };
    
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
                let startDate, endDate;
                let processedData = [];

                switch (rangeType) {
                    case 'daily': // This week's days
                        startDate = startOfWeek(today, { weekStartsOn: 1 });
                        endDate = endOfWeek(today, { weekStartsOn: 1 });
                        const recordsDaily = await fetchChartData(startDate, endDate, selectedWbNumber);
                        const days = eachDayOfInterval({ start: startDate, end: endDate });
                        processedData = days.map(day => {
                            const dayRecords = recordsDaily.filter(r => {
                                const recordDate = parseApiDate(r.date);
                                return recordDate && format(recordDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
                            });
                            return {
                                name: format(day, 'EEE'),
                                vehicles: dayRecords.length,
                                charges: dayRecords.reduce((acc, rec) => acc + (Number(rec.charges) || 0), 0)
                            };
                        });
                        break;
                    
                    case 'weekly': // This month's weeks
                        startDate = startOfMonth(today);
                        endDate = endOfMonth(today);
                        const recordsWeekly = await fetchChartData(startDate, endDate, selectedWbNumber);
                        const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
                        
                        processedData = weeks.map(weekStart => {
                            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                            const weekRecords = recordsWeekly.filter(r => {
                                const recordDate = parseApiDate(r.date);
                                return recordDate && isWithinInterval(recordDate, { start: weekStart, end: weekEnd });
                            });
                            return {
                                name: `Week ${getISOWeek(weekStart)}`,
                                vehicles: weekRecords.length,
                                charges: weekRecords.reduce((acc, rec) => acc + (Number(rec.charges) || 0), 0)
                            };
                        });
                        break;

                    case 'monthly': // This year's months
                        startDate = startOfYear(today);
                        endDate = endOfYear(today);
                        const recordsMonthly = await fetchChartData(startDate, endDate, selectedWbNumber);
                        const months = eachMonthOfInterval({ start: startDate, end: endDate });
                        
                        processedData = months.map(monthStart => {
                            const monthRecords = recordsMonthly.filter(r => {
                                const recordDate = parseApiDate(r.date);
                                return recordDate && getYear(recordDate) === getYear(monthStart) && getMonth(recordDate) === getMonth(monthStart);
                            });
                             return {
                                name: format(monthStart, 'MMM'),
                                vehicles: monthRecords.length,
                                charges: monthRecords.reduce((acc, rec) => acc + (Number(rec.charges) || 0), 0)
                            };
                        });
                        break;
                    
                    case 'yearly': // Last 3 years
                        startDate = startOfYear(subYears(today, 2));
                        endDate = endOfYear(today);
                        const recordsYearly = await fetchChartData(startDate, endDate, selectedWbNumber);
                        const years = eachYearOfInterval({ start: startDate, end: endDate });
                         processedData = years.map(yearStart => {
                            const yearRecords = recordsYearly.filter(r => {
                               const recordDate = parseApiDate(r.date);
                               return recordDate && getYear(recordDate) === getYear(yearStart);
                            });
                            return {
                                name: format(yearStart, 'yyyy'),
                                vehicles: yearRecords.length,
                                charges: yearRecords.reduce((acc, rec) => acc + (Number(rec.charges) || 0), 0)
                            };
                        });
                        break;
                    
                    default:
                        processedData = [];
                }
                
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
    }, [toast, selectedWbNumber, rangeType]);
    
    return (
        <Card className="mt-6">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <CardTitle>Activity Overview</CardTitle>
                        <CardDescription>A summary of weighbridge activity over time.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <div className="w-full sm:w-[220px]">
                            <Select onValueChange={setRangeType} defaultValue="daily">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">This Week (Daily)</SelectItem>
                                    <SelectItem value="weekly">This Month (Weekly)</SelectItem>
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
                        <p className="text-muted-foreground">No records found for the selected period.</p>
                    </div>
                ) : (
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <ChartComponent data={chartData} />
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
