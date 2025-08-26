
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Loader2, Edit, MapPin } from "lucide-react";
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


export function EditCustomerDialog({ isOpen, setIsOpen, customer, onUpdateCustomer }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapEditMode, setIsMapEditMode] = useState(false);

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
  
  useEffect(() => {
    if (customer) {
      form.reset({
        companyName: customer.companyName || "",
        contactPerson: customer.contactPerson || "",
        gstNo: customer.gstNo || "",
        whatsappNumber: customer.whatsappNumber || "",
        email: customer.email || "",
        locationUrl: customer.locationUrl || "",
        latitude: customer.latitude,
        longitude: customer.longitude
      });
    }
    // Reset map edit mode when dialog is opened or customer changes
    setIsMapEditMode(false);
  }, [customer, form, isOpen]);

  const handleLocationSelect = (lat, lng) => {
    form.setValue("latitude", lat, { shouldValidate: true });
    form.setValue("longitude", lng, { shouldValidate: true });
  };

  async function onSubmit(values) {
    setIsSubmitting(true);
    await onUpdateCustomer(values);
    setIsSubmitting(false);
  }

  const GoogleMapsEmbed = ({ lat, lng }) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        return <div className="h-80 w-full rounded-md border bg-muted flex items-center justify-center"><p>Location not available.</p></div>;
    }
    const embedUrl = `https://www.google.com/maps?q=${lat},${lng}&hl=en&z=14&output=embed`;
    return (
      <div className="h-80 w-full rounded-md border overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          src={embedUrl}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Customer Location"
        ></iframe>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Customer: {customer?.companyName}</DialogTitle>
          <DialogDescription>Update the customer details below.</DialogDescription>
        </DialogHeader>
         <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
             <div className="grid md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
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
                        <Input {...field} />
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
                        <Input {...field} />
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
                        <Input {...field} />
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
                        <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex justify-between items-center">
                      <span className="flex items-center gap-2"><MapPin /> Location</span>
                       <Button type="button" variant="ghost" size="sm" onClick={() => setIsMapEditMode(!isMapEditMode)}>
                         <Edit className="mr-2 h-4 w-4" />
                         {isMapEditMode ? "View Map" : "Edit Location"}
                       </Button>
                    </FormLabel>
                    <FormControl>
                        {isMapEditMode ? (
                             <MapPicker 
                                onLocationSelect={handleLocationSelect} 
                                initialPosition={customer && customer.latitude && customer.longitude ? [customer.latitude, customer.longitude] : undefined}
                              />
                        ) : (
                            <GoogleMapsEmbed lat={customer?.latitude} lng={customer?.longitude} />
                        )}
                    </FormControl>
                     <FormMessage>{form.formState.errors.latitude?.message || form.formState.errors.longitude?.message}</FormMessage>
                  </FormItem>
                )}
              />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                    </>
                ) : (
                    "Save Changes"
                )}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
