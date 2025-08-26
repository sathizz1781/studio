
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Loader2, MapPin } from "lucide-react";
import Link from "next/link";


const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required."),
  contactPerson: z.string().min(1, "Contact person is required."),
  gstNo: z.string().min(1, "GST number is required."),
  whatsappNumber: z.string().regex(/^\d{10,15}$/, "Please enter a valid WhatsApp number.").optional().or(z.literal('')),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal('')),
  locationUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  latitude: z.coerce.number({ required_error: "Latitude is required." }).min(-90, "Invalid latitude").max(90, "Invalid latitude"),
  longitude: z.coerce.number({ required_error: "Longitude is required." }).min(-180, "Invalid longitude").max(180, "Invalid longitude"),
});


export function EditCustomerDialog({ isOpen, setIsOpen, customer, onUpdateCustomer }) {
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
      latitude: "",
      longitude: "",
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
  }, [customer, form, isOpen]);


  async function onSubmit(values) {
    setIsSubmitting(true);
    await onUpdateCustomer(values);
    setIsSubmitting(false);
  }

  const GoogleMapsEmbed = ({ lat, lng }) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        return <div className="h-60 w-full rounded-md border bg-muted flex items-center justify-center"><p>Location not available.</p></div>;
    }
    const embedUrl = `https://www.google.com/maps?q=${lat},${lng}&hl=en&z=14&output=embed`;
    return (
      <div className="h-60 w-full rounded-md border overflow-hidden">
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
  
  const currentLat = form.watch("latitude");
  const currentLng = form.watch("longitude");

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
             <div className="space-y-4 rounded-lg border p-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-base font-medium flex items-center gap-2"><MapPin size={16} /> Customer Location</h3>
                     <Button variant="link" size="sm" asChild>
                       <Link href="https://www.google.com/maps" target="_blank">Find on Google Maps</Link>
                    </Button>
                </div>
                 <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="e.g., 11.3410" {...field} />
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
                            <Input type="number" placeholder="e.g., 77.7172" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                 <GoogleMapsEmbed lat={currentLat} lng={currentLng} />
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
