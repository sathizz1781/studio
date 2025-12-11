
"use client";

import React, { useState, useEffect } from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, startOfYear, endOfYear, subYears } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
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

const DayWiseTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border p-2 rounded-lg shadow-lg">
                <p className="font-bold">{label}</p>
                <p className="text-sm" style={{ color: "hsl(var(--chart-1))" }}>{`Vehicles: ${payload.find(p => p.dataKey === 'vehicles')?.value}`}</p>
                <p className="text-sm" style={{ color: "hsl(var(--chart-2))" }}>{`Charges: ₹${payload.find(p => p.dataKey === 'charges')?.value?.toLocaleString()}`}</p>
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
                
                if (rangeType === 'daywise') {
                    const last30DaysData = await fetchChartData(subDays(today, 29), today, selectedWbNumber);
                    const processedData = last30DaysData.reduce((acc, record) => {
                        const date = record.date;
                        if (!acc[date]) {
                            acc[date] = { date, vehicles: 0, charges: 0 };
                        }
                        acc[date].vehicles += 1;
                        acc[date].charges += Number(record.charges) || 0;
                        return acc;
                    }, {});

                    // Create data for all last 30 days, filling missing days with 0
                    const finalData = Array.from({ length: 30 }, (_, i) => {
                        const date = subDays(today, i);
                        const formattedDate = format(date, 'dd/MM/yyyy');
                        return processedData[formattedDate] || { date: formattedDate, vehicles: 0, charges: 0 };
                    }).reverse();
                    
                    setChartData(finalData);
                
                } else {
                    let currentRange, previousRange, labels;

                    if (rangeType === 'daily') {
                        currentRange = { start: today, end: today };
                        previousRange = { start: subDays(today, 1), end: subDays(today, 1) };
                        labels = { current: "Current Day", previous: "Previous Day" };
                    } else if (rangeType === 'weekly') {
                        currentRange = { start: startOfWeek(today), end: endOfWeek(today) };
                        previousRange = { start: startOfWeek(subWeeks(today, 1)), end: endOfWeek(subWeeks(today, 1)) };
                        labels = { current: "Current Week", previous: "Previous Week" };
                    } else if (rangeType === 'monthly') {
                        currentRange = { start: startOfMonth(today), end: endOfMonth(today) };
                        previousRange = { start: startOfMonth(subMonths(today, 1)), end: endOfMonth(subMonths(today, 1)) };
                        labels = { current: "Current Month", previous: "Previous Month" };
                    } else { // yearly
                        currentRange = { start: startOfYear(today), end: endOfYear(today) };
                        previousRange = { start: startOfYear(subYears(today, 1)), end: endOfYear(subYears(today, 1)) };
                        labels = { current: "Current Year", previous: "Previous Year" };
                    }

                    const currentDataPromise = fetchChartData(currentRange.start, currentRange.end, selectedWbNumber);
                    const previousDataPromise = fetchChartData(previousRange.start, previousRange.end, selectedWbNumber);
                    
                    const [currentRecords, previousRecords] = await Promise.all([currentDataPromise, previousDataPromise]);
                    
                    const currentCharges = currentRecords.reduce((sum, record) => sum + (Number(record.charges) || 0), 0);
                    const previousCharges = previousRecords.reduce((sum, record) => sum + (Number(record.charges) || 0), 0);

                    setChartData([
                        { name: labels.previous, vehicles: previousRecords.length, charges: previousCharges },
                        { name: labels.current, vehicles: currentRecords.length, charges: currentCharges },
                    ]);
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
    
    const renderComparisonChart = () => (
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
    );

    const renderDayWiseChart = () => (
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
            <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" label={{ value: 'Vehicles', angle: -90, position: 'insideLeft' }}/>
            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" label={{ value: 'Charges (₹)', angle: -90, position: 'insideRight' }}/>
            <Tooltip content={<DayWiseTooltip />} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="vehicles" stroke="hsl(var(--chart-1))" name="Vehicles" />
            <Line yAxisId="right" type="monotone" dataKey="charges" stroke="hsl(var(--chart-2))" name="Charges (₹)" />
        </LineChart>
    );


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
                            <Select onValueChange={setRangeType} value={rangeType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daywise">Day-wise (Last 30 days)</SelectItem>
                                    <SelectItem value="daily">Daily Comparison</SelectItem>
                                    <SelectItem value="weekly">Weekly Comparison</SelectItem>
                                    <SelectItem value="monthly">Monthly Comparison</SelectItem>
                                    <SelectItem value="yearly">Yearly Comparison</SelectItem>
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
                           {rangeType === 'daywise' ? renderDayWiseChart() : renderComparisonChart()}
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
