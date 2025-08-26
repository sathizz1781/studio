
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/map-picker'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-muted flex items-center justify-center rounded-md"><Loader2 className="h-8 w-8 animate-spin" /></div>
});


const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required."),
  contactPerson: z.string().min(1, "Contact person is required."),
  gstNo: z.string().min(1, "GST number is required."),
  whatsappNumber: z.string().regex(/^\d{10,15}$/, "Please enter a valid WhatsApp number.").optional().or(z.literal('')),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal('')),
  latitude: z.coerce.number({ required_error: "Please select a location on the map." }),
  longitude: z.coerce.number({ required_error: "Please select a location on the map." }),
});


export function EditCustomerDialog({ isOpen, setIsOpen, customer, onUpdateCustomer }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      contactPerson: "",
      gstNo: "",
      whatsappNumber: "",
      email: "",
      latitude: 0,
      longitude: 0,
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
        latitude: customer.latitude || 11.3410,
        longitude: customer.longitude || 77.7172,
      });
      setIsEditingLocation(false);
    }
  }, [customer, form, isOpen]);

  const handleLocationChange = ({ lat, lng }) => {
    form.setValue('latitude', lat);
    form.setValue('longitude', lng);
  };

  async function onSubmit(values) {
    setIsSubmitting(true);
    await onUpdateCustomer(values);
    setIsSubmitting(false);
  }

  const lat = form.watch('latitude');
  const lng = form.watch('longitude');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xl">
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
            </div>
            
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <FormLabel>Location</FormLabel>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingLocation(!isEditingLocation)}>
                       {isEditingLocation ? "View Map" : "Edit Location"}
                    </Button>
                </div>
                
                {isEditingLocation ? (
                    <div className="rounded-md border h-[400px]">
                        <MapPicker 
                            center={[lat, lng]}
                            onLocationChange={handleLocationChange}
                        />
                    </div>
                ) : (
                    <div className="rounded-md border h-[400px] w-full overflow-hidden">
                        <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${lat},${lng}`}>
                        </iframe>
                    </div>
                )}
                 <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input type="number" readOnly={!isEditingLocation} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input type="number" readOnly={!isEditingLocation} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
            </div>

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
