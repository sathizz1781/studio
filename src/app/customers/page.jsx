
"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Edit, Trash2, Search, User, Building, Phone, Mail, Globe, MapPin } from "lucide-react";

const MapPicker = dynamic(() => import('@/components/map-picker'), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center bg-muted rounded-md"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

const customerSchema = z.object({
  contactPerson: z.string().min(1, "Contact person is required"),
  companyName: z.string().min(1, "Company name is required"),
  whatsappNumber: z.string().min(1, "WhatsApp number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  locationUrl: z.string().url("Invalid URL").optional().or(z.literal('')),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export default function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [tempLocation, setTempLocation] = useState({ lat: 11.3410, lng: 77.7172 });


  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      contactPerson: "",
      companyName: "",
      whatsappNumber: "",
      email: "",
      locationUrl: "",
      latitude: 11.3410, 
      longitude: 77.7172,
    },
  });

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("https://bend-mqjz.onrender.com/api/user/userlist", {
        headers: { "Content-Type": "application/json" },
      });
      setCustomers(response.data.users || []);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch customers.",
      });
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSheetOpen = (customer = null) => {
    setEditingCustomer(customer);
    const defaultLat = 11.3410;
    const defaultLng = 77.7172;

    if (customer) {
      form.reset({
        contactPerson: customer.contactPerson || "",
        companyName: customer.companyName || "",
        whatsappNumber: customer.whatsappNumber || "",
        email: customer.email || "",
        locationUrl: customer.locationUrl || "",
        latitude: customer.latitude || defaultLat,
        longitude: customer.longitude || defaultLng,
      });
      setTempLocation({ lat: customer.latitude || defaultLat, lng: customer.longitude || defaultLng });
    } else {
      form.reset({
        contactPerson: "",
        companyName: "",
        whatsappNumber: "",
        email: "",
        locationUrl: "",
        latitude: defaultLat,
        longitude: defaultLng,
      });
       setTempLocation({ lat: defaultLat, lng: defaultLng });
    }
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setEditingCustomer(null);
    form.reset();
  };

  const handleConfirmLocation = () => {
    form.setValue('latitude', tempLocation.lat);
    form.setValue('longitude', tempLocation.lng);
    setIsMapDialogOpen(false);
  };

  const onSubmit = async (data) => {
    const apiEndpoint = editingCustomer
      ? `https://bend-mqjz.onrender.com/api/user/updateuser/${editingCustomer.customerId}`
      : "https://bend-mqjz.onrender.com/api/user/createuser";
    const apiMethod = "post";
    
    const payload = editingCustomer 
        ? data 
        : { ...data, customerId: `CUST${10000 + (customers.length + 1)}` };
        
    try {
      await axios[apiMethod](apiEndpoint, payload);
      toast({
        title: "Success",
        description: `Customer has been successfully ${editingCustomer ? "updated" : "created"}.`,
      });
      fetchCustomers();
      handleSheetClose();
    } catch (error) {
      console.error("Failed to save customer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Could not save customer.",
      });
    }
  };
  
  const handleDelete = async (customerId) => {
     if (!window.confirm("Are you sure you want to delete this customer?")) return;
      try {
        await axios.post(`https://bend-mqjz.onrender.com/api/user/deleteuser/${customerId}`);
        toast({
          title: "Success",
          description: "Customer deleted successfully.",
        });
        fetchCustomers();
      } catch (error) {
         console.error("Failed to delete customer:", error);
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete customer.",
         });
      }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      (customer.contactPerson && customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.companyName && customer.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.whatsappNumber && customer.whatsappNumber.includes(searchTerm))
  );
  
  const { formState: { isSubmitting }, watch } = form;
  const watchedLatitude = watch("latitude");
  const watchedLongitude = watch("longitude");

  return (
    <div className="container mx-auto py-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground">Manage your customer information.</p>
        </div>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:w-64">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input
                    placeholder="Search customers..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button onClick={() => handleSheetOpen()} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Customer
            </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCustomers.map((customer) => (
            <Card key={customer.customerId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building /> {customer.companyName || 'N/A'}
                </CardTitle>
                 <CardDescription className="flex items-center gap-2 pt-1">
                    <User size={14}/> {customer.contactPerson}
                 </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Phone size={14}/> {customer.whatsappNumber}
                </p>
                {customer.email && (
                    <p className="flex items-center gap-2 truncate">
                        <Mail size={14}/> {customer.email}
                    </p>
                )}
                {customer.locationUrl && (
                    <p className="flex items-center gap-2 truncate">
                        <Globe size={14}/> 
                        <a href={customer.locationUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                           Location Link
                        </a>
                    </p>
                )}
                 {customer.latitude && customer.longitude && (
                   <div className="flex items-center gap-2 text-primary hover:underline">
                        <MapPin size={14}/> 
                        <a href={`https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`} target="_blank" rel="noopener noreferrer">
                           View on Google Maps
                        </a>
                   </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="icon" onClick={() => handleSheetOpen(customer)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleDelete(customer.customerId)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold">No Customers Found</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm ? "Try adjusting your search." : "Click 'Add Customer' to get started."}
          </p>
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
              <SheetHeader>
                <SheetTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</SheetTitle>
                <SheetDescription>
                  {editingCustomer ? "Update the details for this customer." : "Fill in the form to create a new customer."}
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex-1 py-6 px-1 space-y-4">
                 <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., ACME Inc." {...field} />
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
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="e.g., 9876543210" {...field} />
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
                           <Input type="email" placeholder="e.g., john.doe@example.com" {...field} />
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

                  <div className="space-y-2 pt-4">
                    <Label>Location Coordinates</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">Latitude</FormLabel>
                            <FormControl><Input readOnly {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">Longitude</FormLabel>
                            <FormControl><Input readOnly {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                     <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="outline" className="w-full">
                                <MapPin className="mr-2 h-4 w-4" />
                                Set Location on Map
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Select Location</DialogTitle>
                                <DialogDescription>Drag the marker to the desired location, then click confirm.</DialogDescription>
                            </DialogHeader>
                            <MapPicker
                              latitude={watchedLatitude}
                              longitude={watchedLongitude}
                              onLocationChange={(lat, lng) => setTempLocation({ lat, lng })}
                            />
                            <DialogFooter>
                                <DialogClose asChild>
                                  <Button type="button" variant="secondary">Cancel</Button>
                                </DialogClose>
                                <Button type="button" onClick={handleConfirmLocation}>Confirm</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                  </div>
              </div>

              <SheetFooter className="mt-auto">
                <SheetClose asChild>
                  <Button type="button" variant="outline" onClick={handleSheetClose}>Cancel</Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting}>
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   {editingCustomer ? 'Save Changes' : 'Create Customer'}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

    