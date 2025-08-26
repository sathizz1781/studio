
"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CustomerList({ customers, onSelectCustomer }) {
  if (!customers || customers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Customers Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You can add a new customer from the 'Add New Customer' tab.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>WhatsApp</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {customers.map((customer) => (
                    <TableRow key={customer.customerId} onClick={() => onSelectCustomer(customer)} className="cursor-pointer">
                        <TableCell className="font-medium">{customer.companyName}</TableCell>
                        <TableCell>{customer.contactPerson}</TableCell>
                        <TableCell>
                            <Badge variant="secondary">{customer.customerId}</Badge>
                        </TableCell>
                        <TableCell>{customer.whatsappNumber}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </div>
      </CardContent>
    </Card>
  );
}
