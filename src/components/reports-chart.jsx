
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format, subDays } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

async function fetchChartData(startDate, endDate) {
    const query = {
        startDate: format(startDate, "dd/MM/yyyy"),
        endDate: format(endDate, "dd/MM/yyyy"),
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

export function ReportsChart() {
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const getChartData = async () => {
            setIsLoading(true);
            try {
                const today = new Date();
                const yesterday = subDays(today, 1);

                const todayDataPromise = fetchChartData(today, today);
                const yesterdayDataPromise = fetchChartData(yesterday, yesterday);
                
                const [todayRecords, yesterdayRecords] = await Promise.all([todayDataPromise, yesterdayDataPromise]);
                
                const todayCharges = todayRecords.reduce((sum, record) => sum + (Number(record.charges) || 0), 0);
                const yesterdayCharges = yesterdayRecords.reduce((sum, record) => sum + (Number(record.charges) || 0), 0);

                setChartData([
                    { name: "Previous Day", vehicles: yesterdayRecords.length, charges: yesterdayCharges, fill: "var(--color-secondary)" },
                    { name: "Current Day", vehicles: todayRecords.length, charges: todayCharges, fill: "var(--color-primary)" },
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
    }, [toast]);
    
    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-background border p-2 rounded-lg shadow-lg">
            <p className="font-bold">{label}</p>
            <p className="text-sm text-blue-500">{`Vehicles: ${payload[0].value}`}</p>
            <p className="text-sm text-green-500">{`Charges: ₹${payload[1].value.toLocaleString()}`}</p>
          </div>
        );
      }
      return null;
    };


    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Daily Activity</CardTitle>
                <CardDescription>Comparison of the last two days of activity.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[350px] w-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="h-[350px]">
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
