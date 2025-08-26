
"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Edit, Trash2, Search, User, Building, Phone, Mail, Globe } from "lucide-react";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  companyName: z.string().optional(),
  contactNumber: z.string().min(1, "Contact number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
});

export default function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      companyName: "",
      contactNumber: "",
      email: "",
      website: "",
    },
  });

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("https://bend-mqjz.onrender.com/api/customers");
      setCustomers(response.data.data || []);
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
    if (customer) {
      form.reset({
        name: customer.name || "",
        companyName: customer.companyName || "",
        contactNumber: customer.contactNumber || "",
        email: customer.email || "",
        website: customer.website || "",
      });
    } else {
      form.reset({
        name: "",
        companyName: "",
        contactNumber: "",
        email: "",
        website: "",
      });
    }
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setEditingCustomer(null);
    form.reset();
  };

  const onSubmit = async (data) => {
    const apiEndpoint = editingCustomer
      ? `https://bend-mqjz.onrender.com/api/customers/${editingCustomer._id}`
      : "https://bend-mqjz.onrender.com/api/customers";
    const apiMethod = editingCustomer ? "patch" : "post";

    try {
      const response = await axios[apiMethod](apiEndpoint, data);
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
        await axios.delete(`https://bend-mqjz.onrender.com/api/customers/${customerId}`);
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
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactNumber.includes(searchTerm)
  );
  
  const { formState: { isSubmitting } } = form;

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
            <Card key={customer._id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User /> {customer.name}
                </CardTitle>
                {customer.companyName && (
                  <CardDescription className="flex items-center gap-2">
                    <Building size={14}/> {customer.companyName}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Phone size={14}/> {customer.contactNumber}
                </p>
                {customer.email && (
                    <p className="flex items-center gap-2 truncate">
                        <Mail size={14}/> {customer.email}
                    </p>
                )}
                {customer.website && (
                    <p className="flex items-center gap-2 truncate">
                        <Globe size={14}/> 
                        <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                           {customer.website}
                        </a>
                    </p>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="icon" onClick={() => handleSheetOpen(customer)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleDelete(customer._id)}>
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

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg w-full">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
              <SheetHeader>
                <SheetTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</SheetTitle>
                <SheetDescription>
                  {editingCustomer ? "Update the details for this customer." : "Fill in the form to create a new customer."}
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto py-6 px-1 space-y-4">
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
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
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                           <Input type="email" placeholder="e.g., john.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                           <Input placeholder="e.g., https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <SheetFooter>
                <SheetClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
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
