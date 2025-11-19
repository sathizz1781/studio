
"use client";

import React, { useEffect, useState } from "react";
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
import { Lock, Unlock, CalendarPlus, AlertCircle, Users, Loader2 } from "lucide-react";
import { differenceInDays, parseISO, format, addMonths } from "date-fns";

export default function SubscriptionPage() {
  const { user, entities, updateEntity } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const [localEntities, setLocalEntities] = useState(entities);
  const [isLoading, setIsLoading] = useState(true);

  // Protect the route
  useEffect(() => {
    if (user && user.role !== "developer") {
      router.push("/");
    }
  }, [user, router]);
  
  useEffect(() => {
     setLocalEntities(entities);
     if (entities.length > 0) {
        setIsLoading(false);
     }
  }, [entities]);

  const handleExtendSubscription = (entityId) => {
    const entity = localEntities.find(e => e.id === entityId);
    if (!entity) return;

    const currentEndDate = parseISO(entity.subscriptionEndDate);
    const newEndDate = addMonths(currentEndDate, 1);
    
    const updated = updateEntity(entityId, { subscriptionEndDate: newEndDate.toISOString().split("T")[0] });
    setLocalEntities(updated);

    toast({
        title: "Subscription Extended",
        description: `${entity.companyName}'s subscription has been extended to ${format(newEndDate, "PPP")}.`,
    });
  };

  const handleToggleBlock = (entityId, isCurrentlyBlocked) => {
    const entity = localEntities.find(e => e.id === entityId);
    if (!entity) return;

    const updated = updateEntity(entityId, { isBlocked: !isCurrentlyBlocked });
    setLocalEntities(updated);
    
    toast({
        title: `Entity ${isCurrentlyBlocked ? 'Unblocked' : 'Blocked'}`,
        description: `${entity.companyName} can ${isCurrentlyBlocked ? 'now' : 'no longer'} log in.`,
    });
  };
  
  if (!user || user.role !== 'developer') {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <p>Redirecting...</p>
        </div>
    );
  }
  
  if (isLoading) {
     return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
                   {localEntities.length > 0 ? localEntities.map((entity) => {
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
                         <TableRow key={entity.id}>
                            <TableCell className="font-medium">{entity.companyName}</TableCell>
                            <TableCell>
                                <Badge variant={statusVariant}>{statusText}</Badge>
                            </TableCell>
                            <TableCell>{format(endDate, "PPP")}</TableCell>
                            <TableCell>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExtendSubscription(entity.id)}
                                >
                                    <CalendarPlus className="mr-2 h-4 w-4" />
                                    Extend 1 Month
                                </Button>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                     <Switch
                                        checked={entity.isBlocked}
                                        onCheckedChange={() => handleToggleBlock(entity.id, entity.isBlocked)}
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
                                No entities found.
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

    