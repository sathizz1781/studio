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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { useEffect } from "react";

const configSchema = z.object({
  upiId: z.string().min(3, "UPI ID is required"),
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  password: z.string().optional(),
  serialHost: z.string().optional(),
});

export default function ConfigPage() {
  const { config, saveConfig } = useAppContext();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(configSchema),
    defaultValues: config,
  });
  
  const { formState: { isSubmitting }, reset } = form;

  useEffect(() => {
    reset(config);
  }, [config, reset]);

  const onSubmit = (data) => {
    saveConfig(data);
    toast({
      title: "Configuration Saved",
      description: "Your settings have been updated successfully.",
    });
  };

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
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="e.g., 9876543210" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Set a new password" {...field} />
                    </FormControl>
                    <FormMessage />
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
