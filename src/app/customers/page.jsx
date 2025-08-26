
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CustomerList } from "@/components/customer-list";
import { AddCustomerForm } from "@/components/add-customer-form";
import { EditCustomerDialog } from "@/components/edit-customer-dialog";
import { Loader2 } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://bend-mqjz.onrender.com/api/user/userlist");
      if (!response.ok) {
        throw new Error("Failed to fetch customer list.");
      }
      const data = await response.json();
      setCustomers(data.users || []);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load customers. Please try again later.",
      });
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomer = async (values) => {
    try {
      const customerData = {
         customerId: `CUST${10000 + (customers.length + 1)}`, // Auto-generated
        ...values,
      };
      
      const response = await fetch("https://bend-mqjz.onrender.com/api/user/createuser", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        throw new Error("Failed to create customer.");
      }
      
      const result = await response.json();
      setCustomers([result.user, ...customers]);

      toast({
        title: "Success",
        description: `Customer ${result.user.companyName} has been added.`,
      });
      setActiveTab("list");
      return true;

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not add customer. Please try again.",
      });
      return false;
    }
  };
  
  const handleUpdateCustomer = async (values) => {
    if (!selectedCustomer) return false;
    
    try {
      const response = await fetch(`https://bend-mqjz.onrender.com/api/user/updateuser/${selectedCustomer.customerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to update customer.");
      }
      
      const result = await response.json();

      setCustomers(customers.map(c => c.customerId === selectedCustomer.customerId ? result.user : c));

      toast({
        title: "Success",
        description: `Customer ${result.user.companyName} has been updated.`,
      });

      setIsDialogOpen(false);
      setSelectedCustomer(null);
      return true;

    } catch (error) {
       console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update customer. Please try again.",
      });
      return false;
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-4">
      <h1 className="text-3xl font-bold mb-6">Customer Management</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Customer List</TabsTrigger>
          <TabsTrigger value="add">Add New Customer</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          {isLoading ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
             </div>
          ) : (
             <CustomerList customers={customers} onSelectCustomer={handleSelectCustomer} />
          )}
        </TabsContent>
        <TabsContent value="add">
           <AddCustomerForm onAddCustomer={handleAddCustomer} />
        </TabsContent>
      </Tabs>
      
      {selectedCustomer && (
         <EditCustomerDialog 
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            customer={selectedCustomer}
            onUpdateCustomer={handleUpdateCustomer}
         />
      )}
    </div>
  );
}
