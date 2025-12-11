
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format, subDays } from "date-fns";
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
    if (!wb_number) return []; // Don't fetch if no wb_number is provided
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
            // Default to first entity for developer if none is selected
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

                const todayDataPromise = fetchChartData(today, today, selectedWbNumber);
                const yesterdayDataPromise = fetchChartData(yesterday, yesterday, selectedWbNumber);
                
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
    }, [toast, selectedWbNumber]);
    
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Daily Activity</CardTitle>
                        <CardDescription>Comparison of the last two days of activity.</CardDescription>
                    </div>
                     {user?.role === 'developer' && entities && entities.length > 0 && (
                        <div className="mt-4 sm:mt-0 w-full sm:w-auto sm:min-w-[200px]">
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

    