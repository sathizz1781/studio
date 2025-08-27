
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Fuel, Tag, MapPin, IndianRupee, Car } from 'lucide-react';

const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-center text-sm">
        {icon}
        <span className="font-medium ml-2 mr-1">{label}:</span>
        <span className="text-muted-foreground">{value}</span>
    </div>
);

const VehicleInfoSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="flex items-center space-x-4">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex items-center space-x-4">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-1/3" />
            </div>
             <div className="flex items-center space-x-4">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-1/4" />
            </div>
        </CardContent>
    </Card>
);

export function VehicleInfo({ data, isLoading }) {
    if (isLoading) {
        return <VehicleInfoSkeleton />;
    }

    if (!data) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Car size={24} /> {data.make} {data.model}
                </CardTitle>
                <CardDescription>{data.plate} - {data.region}</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="overview">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="rc" disabled>RC</TabsTrigger>
                        <TabsTrigger value="insurance" disabled>Insurance</TabsTrigger>
                        <TabsTrigger value="challan" disabled>Challan</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="pt-4">
                       <div className="grid grid-cols-2 gap-4">
                            <InfoRow icon={<Tag size={16} className="text-primary"/>} label="Variant" value={data.variant} />
                            <InfoRow icon={<Fuel size={16} className="text-primary"/>} label="Fuel" value={data.fuel} />
                            <InfoRow icon={<IndianRupee size={16} className="text-primary"/>} label="Avg. Price" value={data.avgPrice} />
                            <InfoRow icon={<MapPin size={16} className="text-primary"/>} label="State" value={data.region} />
                       </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
