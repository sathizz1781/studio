
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Lock, Unlock, CalendarPlus, Users, Loader2 } from "lucide-react";
import { differenceInDays, parseISO, format, addMonths } from "date-fns";

export default function SubscriptionPage() {
  const { user, entities, fetchAllEntities, setEntities } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // Protect the route
  useEffect(() => {
    if (user && user.role !== "developer") {
      router.push("/");
    }
  }, [user, router]);
  
  const loadEntities = useCallback(async () => {
    setIsLoading(true);
    try {
        const fetchedEntities = await fetchAllEntities();
        // The context will be updated by the fetchAllEntities call inside the provider,
        // but we can set it here as well to be sure.
        setEntities(fetchedEntities); 
    } catch (error) {
        console.error("Failed to load entities:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch entity data."
        });
        setEntities([]); // Ensure entities is an empty array on error
    } finally {
        setIsLoading(false);
    }
  }, [fetchAllEntities, setEntities, toast]);

  useEffect(() => {
     if(user?.role === 'developer'){
       loadEntities();
     } else {
       setIsLoading(false);
     }
  }, [user, loadEntities]);

  const handleExtendSubscription = async (entityId, companyName) => {
    const entity = entities.find(e => e._id === entityId);
    if (!entity) return;

    const currentEndDate = parseISO(entity.subscriptionEndDate);
    const newEndDate = addMonths(currentEndDate, 1).toISOString().split("T")[0];

    try {
        const response = await fetch(`https://bend-mqjz.onrender.com/api/config/update/${entity.mobileNumber}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscriptionEndDate: newEndDate }),
        });
        if (!response.ok) throw new Error("Failed to extend subscription.");
        
        loadEntities(); // Refresh list from backend

        toast({
            title: "Subscription Extended",
            description: `${companyName}'s subscription has been extended to ${format(parseISO(newEndDate), "PPP")}.`,
        });
    } catch(error) {
         toast({
            variant: "destructive",
            title: "Update Error",
            description: error.message,
        });
    }
  };

  const handleToggleBlock = async (entity, isCurrentlyBlocked) => {
    if (!entity) return;

    try {
       const response = await fetch(`https://bend-mqjz.onrender.com/api/config/update/${entity.mobileNumber}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isBlocked: !isCurrentlyBlocked }),
        });
        if (!response.ok) throw new Error(`Failed to ${isCurrentlyBlocked ? 'unblock' : 'block'} entity.`);

        loadEntities(); // Refresh list from backend
        
        toast({
            title: `Entity ${isCurrentlyBlocked ? 'Unblocked' : 'Blocked'}`,
            description: `${entity.companyName} can ${isCurrentlyBlocked ? 'now' : 'no longer'} log in.`,
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Update Error",
            description: error.message,
        });
    }
  };
  
  if (!user || user.role !== 'developer') {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
             <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }
  
  if (isLoading) {
     return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                <p className="mt-2 text-muted-foreground">Fetching entities...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users /> Entity Subscription Management</CardTitle>
          <CardDescription>
            View, extend, and manage subscriptions for all entities.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Company Name</TableHead>
                        <TableHead>Subscription Status</TableHead>
                        <TableHead>Expires On</TableHead>
                        <TableHead>Actions</TableHead>
                        <TableHead className="text-right">Block Access</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                   {entities && entities.length > 0 ? entities.map((entity) => {
                       if (!entity.subscriptionEndDate) return null; // Skip if no subscription date
                       
                       const endDate = parseISO(entity.subscriptionEndDate);
                       const daysRemaining = differenceInDays(endDate, new Date());
                       let statusVariant = "secondary";
                       let statusText = "Active";

                       if (entity.isBlocked) {
                           statusVariant = "destructive";
                           statusText = "Blocked";
                       } else if (daysRemaining < 0) {
                           statusVariant = "destructive";
                           statusText = "Expired";
                       } else if (daysRemaining <= 7) {
                           statusVariant = "default";
                           statusText = "Expires Soon";
                       }

                       return (
                         <TableRow key={entity._id}>
                            <TableCell className="font-medium">{entity.companyName}</TableCell>
                            <TableCell>
                                <Badge variant={statusVariant}>{statusText}</Badge>
                            </TableCell>
                            <TableCell>{format(endDate, "PPP")}</TableCell>
                            <TableCell>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExtendSubscription(entity._id, entity.companyName)}
                                >
                                    <CalendarPlus className="mr-2 h-4 w-4" />
                                    Extend 1 Month
                                </Button>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                     <Switch
                                        checked={!!entity.isBlocked}
                                        onCheckedChange={() => handleToggleBlock(entity, !!entity.isBlocked)}
                                        aria-label={`Block or unblock ${entity.companyName}`}
                                     />
                                     {entity.isBlocked ? <Lock className="h-4 w-4 text-destructive" /> : <Unlock className="h-4 w-4 text-green-600"/>}
                                </div>
                            </TableCell>
                         </TableRow>
                       );
                   }) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No entities found or failed to load.
                            </TableCell>
                        </TableRow>
                   )}
                </TableBody>
            </Table>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
