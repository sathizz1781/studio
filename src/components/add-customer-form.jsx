
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./map-picker').then(mod => mod.MapPicker), { 
    ssr: false,
    loading: () => <p>Loading map...</p>
});

const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required."),
  contactPerson: z.string().min(1, "Contact person is required."),
  gstNo: z.string().min(1, "GST number is required."),
  whatsappNumber: z.string().regex(/^\d{10,15}$/, "Please enter a valid WhatsApp number.").optional().or(z.literal('')),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal('')),
  locationUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  latitude: z.number({ required_error: "Please select a location on the map." }),
  longitude: z.number({ required_error: "Please select a location on the map." }),
});

export function AddCustomerForm({ onAddCustomer }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      contactPerson: "",
      gstNo: "",
      whatsappNumber: "",
      email: "",
      locationUrl: "",
    },
  });

  const handleLocationSelect = (lat, lng) => {
    form.setValue("latitude", lat, { shouldValidate: true });
    form.setValue("longitude", lng, { shouldValidate: true });
  };

  async function onSubmit(values) {
    setIsSubmitting(true);
    const success = await onAddCustomer(values);
    if (success) {
      form.reset();
    }
    setIsSubmitting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a New Customer</CardTitle>
        <CardDescription>Fill out the form to create a new customer entry.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gstNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 29ABCDE1234F1Z5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 9876543210" {...field} />
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
                    <FormLabel>Email Address (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., contact@acme.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="locationUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., https://maps.google.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
                control={form.control}
                name="latitude" // This field is just for validation trigger
                render={() => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                        <MapPicker onLocationSelect={handleLocationSelect} />
                    </FormControl>
                     <FormMessage>{form.formState.errors.latitude?.message || form.formState.errors.longitude?.message}</FormMessage>
                  </FormItem>
                )}
              />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Customer"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
