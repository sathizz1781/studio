
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";

export default function SubscriptionPage() {
  const { user } = useAppContext();
  const router = useRouter();

  // Protect the route
  useEffect(() => {
    if (user && user.role !== "developer") {
      router.push("/");
    }
  }, [user, router]);
  
  if (!user || user.role !== 'developer') {
    // You can show a loader or a simple message while redirecting
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <p>Redirecting...</p>
        </div>
    );
  }

  // Mock subscription data
  const subscription = {
    plan: "Pro Plan",
    status: "Active",
    billingCycle: "Monthly",
    nextBillingDate: "2024-08-15",
    price: 99.99,
  };

  return (
    <div className="container mx-auto py-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>
            View and manage your subscription details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                    <p className="text-sm text-muted-foreground">Current Plan</p>
                    <p className="text-xl font-bold">{subscription.plan}</p>
                </div>
                <Badge variant={subscription.status === "Active" ? "secondary" : "destructive"} className="flex items-center gap-2">
                   {subscription.status === "Active" ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4" />}
                   {subscription.status}
                </Badge>
            </div>
            
            <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Billing Cycle</Label>
                        <p className="font-medium">{subscription.billingCycle}</p>
                    </div>
                     <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Price</Label>
                        <p className="font-medium">₹{subscription.price} / month</p>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Next Billing Date</Label>
                    <p className="font-medium">{subscription.nextBillingDate}</p>
                 </div>
            </div>
            
            <Separator />

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Update Payment Method</h3>
                 <div className="space-y-2">
                    <Label htmlFor="card-number">Card Number</Label>
                    <Input id="card-number" placeholder="**** **** **** 1234" />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="expiry-date">Expiry Date</Label>
                        <Input id="expiry-date" placeholder="MM/YY" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input id="cvc" placeholder="123" />
                    </div>
                 </div>
            </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Button variant="destructive">Cancel Subscription</Button>
          <Button>Update Payment</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

