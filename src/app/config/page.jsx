
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, AlertCircle, CalendarClock, Phone } from "lucide-react";
import { useEffect } from "react";
import { differenceInDays, parseISO, format } from "date-fns";

const configSchema = z.object({
  upiId: z.string().min(3, "UPI ID is required"),
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  password: z.string().optional(),
  serialHost: z.string().optional(),
});

const SubscriptionReminder = ({ subscriptionEndDate }) => {
    if (!subscriptionEndDate) return null;

    const endDate = parseISO(subscriptionEndDate);
    const today = new Date();
    const daysRemaining = differenceInDays(endDate, today);

    let variant = "secondary";
    let message = `Your subscription is valid until ${format(endDate, "PPP")}.`;

    if (daysRemaining < 0) {
        variant = "destructive";
        message = "Your subscription has expired. Please renew to continue service.";
    } else if (daysRemaining <= 7) {
        variant = "default";
        message = `Your subscription will expire in ${daysRemaining + 1} day(s). Please renew soon.`;
    }

    return (
        <div className="p-4 rounded-lg bg-muted/50 flex items-center gap-4">
             <CalendarClock className="h-6 w-6 text-muted-foreground" />
            <div className="flex-1">
                <p className="font-semibold">Subscription Status</p>
                <p className={`text-sm ${variant === 'destructive' ? 'text-destructive' : 'text-muted-foreground'}`}>{message}</p>
            </div>
             <Badge variant={variant}>{daysRemaining < 0 ? "Expired" : daysRemaining <= 7 ? "Expires Soon" : "Active"}</Badge>
        </div>
    );
};


export default function ConfigPage() {
  const { user, config, saveConfig, wb_number, logout } = useAppContext();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(configSchema),
    defaultValues: config,
  });
  
  const { formState: { isSubmitting }, reset } = form;

  useEffect(() => {
    if (user?.role === 'entity') {
        reset(config);
    }
  }, [config, reset, user]);

  const onSubmit = async (data) => {
    const dataToSave = {
        companyName: data.companyName,
        upiId: data.upiId,
        email: data.email,
        serialHost: data.serialHost,
        mobileNumber: wb_number, // The non-editable phone number
    };

    if (data.password) {
        dataToSave.password = data.password;
    }
    
    const isUpdating = !!config._id;
    
    const apiEndpoint = isUpdating 
        ? `https://bend-mqjz.onrender.com/api/config/update/${wb_number}`
        : "https://bend-mqjz.onrender.com/api/config/create";
        
    const apiMethod = isUpdating ? 'PUT' : 'POST';

    try {
      const saveResponse = await fetch(apiEndpoint, {
        method: apiMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.message || "Failed to save configuration to the server.");
      }

      const responseData = await saveResponse.json();
      saveConfig(responseData.data || dataToSave); 
      
      if (data.password && !isUpdating) {
         toast({
            title: "Configuration Saved",
            description: "Your settings have been saved. You can now start creating bills.",
        });
      } else if (data.password && isUpdating) {
        toast({
            title: "Password Changed",
            description: "You have been logged out for security. Please log in again with your new password.",
        });
        logout(); // Logout the user
      } else {
        toast({
            title: "Configuration Updated",
            description: "Your settings have been updated successfully.",
        });
      }

    } catch (error) {
       console.error("Failed to save config:", error);
       toast({
         variant: "destructive",
         title: "Save Error",
         description: error.message || "Could not save settings to the server.",
       });
    }
  };

  if (user?.role !== 'entity') {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertCircle /> Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <p>This page is only available for entity accounts. Developers can manage entities from the Subscription page.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="container mx-auto py-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Application Configuration</CardTitle>
          <CardDescription>
            Manage your business details, payment, and printing settings.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
               <SubscriptionReminder subscriptionEndDate={config.subscriptionEndDate} />
                
               <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-foreground">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>{wb_number}</span>
                  </div>
                   <p className="text-xs text-muted-foreground">This is your unique identifier and cannot be changed.</p>
               </div>

               <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., My Weighbridge" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="upiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UPI ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., username@okhdfcbank" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g., contact@mycompany.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password (Optional)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Leave blank to keep current password" {...field} />
                    </FormControl>
                     <FormMessage />
                     <p className="text-xs text-muted-foreground">Set a password to secure your account. If you change it, you will be logged out.</p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serialHost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Host IP</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 192.168.1.5:4000" {...field} />
                    </FormControl>
                     <p className="text-xs text-muted-foreground">The IP address of the computer running the serial bridge server. Leave blank to default to localhost:4000.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

    