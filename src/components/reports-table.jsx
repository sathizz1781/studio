
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar as CalendarIcon,
  Download,
  FileText,
  Loader2,
  Search,
  CreditCard,
} from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/app/layout";

// PDF and Excel libraries
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

export function ReportsTable() {
  const { user, entities, wb_number } = useAppContext();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [dateRange, setDateRange] = useState({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  const [vehicleNumberFilter, setVehicleNumberFilter] = useState("");
  const [partyNameFilter, setPartyNameFilter] = useState("");
  const { toast } = useToast();
  
  const [selectedWbNumber, setSelectedWbNumber] = useState(wb_number || "");

  useEffect(() => {
    if(user?.role === 'entity' && wb_number) {
        setSelectedWbNumber(wb_number);
    }
  }, [wb_number, user?.role]);

  const fetchRecords = useCallback(async () => {
    const numberToFetch = user?.role === 'developer' ? selectedWbNumber : wb_number;
    if (!numberToFetch) {
        setData([]);
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    try {
      const query = {
        startDate: dateRange?.from ? format(dateRange.from, "dd/MM/yyyy") : null,
        endDate: dateRange?.to ? format(dateRange.to, "dd/MM/yyyy") : null,
        wb_number: numberToFetch,
      };

      if (vehicleNumberFilter) {
        query.vehicleNo = vehicleNumberFilter;
      }
      
      if (partyNameFilter) {
        query.partyName = partyNameFilter;
      }

      const response = await fetch("https://bend-mqjz.onrender.com/api/wb/getrecords", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(query)
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      
      const result = await response.json();
      setData(result.records || []);
      setSelectedRows(new Set()); // Clear selection on new data fetch

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: "Could not load reports. Please try again later.",
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, vehicleNumberFilter, partyNameFilter, toast, user?.role, selectedWbNumber, wb_number]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);
  
  const handleUpdatePayment = async () => {
    const numberToUpdate = user?.role === 'developer' ? selectedWbNumber : wb_number;
    if (selectedRows.size === 0) {
      toast({
        variant: "destructive",
        title: "No selection",
        description: "Please select records to update.",
      });
      return;
    }
    
    setIsUpdating(true);
    try {
      const response = await fetch("https://bend-mqjz.onrender.com/api/wb/updatepaymentstatus", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sl_nos: Array.from(selectedRows), wb_number: numberToUpdate }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update payment status.");
      }
      
      toast({
        title: "Success",
        description: `${selectedRows.size} record(s) updated to Paid.`,
      });
      
      // Refetch data to show updated status
      fetchRecords();

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      // Select only credit items
      const creditRecordIds = data
        .filter(item => item.paid_status === false)
        .map(item => item.sl_no);
      setSelectedRows(new Set(creditRecordIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleRowSelect = (sl_no) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(sl_no)) {
      newSelection.delete(sl_no);
    } else {
      newSelection.add(sl_no);
    }
    setSelectedRows(newSelection);
  };

  const totalCharges = useMemo(() => {
    return data.reduce((total, item) => total + (Number(item.charges) || 0), 0);
  }, [data]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const entityName = user?.role === 'developer'
      ? entities.find(e => e.mobileNumber === selectedWbNumber)?.companyName || 'Report'
      : config.companyName || 'Report';

    doc.text(`${entityName} - Weighbridge Report`, 14, 16);
    doc.autoTable({
      head: [
        [
          "Sl. No",
          "Date",
          "Time",
          "Vehicle No",
          "Party Name",
          "Material",
          "1st Wt",
          "2nd Wt",
          "Net Wt",
          "Charges",
          "Status"
        ],
      ],
      body: data.map((item) => {
        const isPaid = item.paid_status !== false;
        return [
            item.sl_no,
            item.date,
            item.time,
            item.vehicle_no,
            item.party_name,
            item.material_name,
            item.first_weight,
            item.second_weight,
            item.net_weight,
            item.charges,
            isPaid ? "Paid" : "Credit",
        ];
      }),
      startY: 22,
    });
    doc.save("weighbridge-report.pdf");
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((item) => {
        const isPaid = item.paid_status !== false;
        return {
            "Serial No": item.sl_no,
            Date: item.date,
            Time: item.time,
            "Vehicle No": item.vehicle_no,
            "Party Name": item.party_name,
            Material: item.material_name,
            "First Weight": item.first_weight,
            "Second Weight": item.second_weight,
            "Net Weight": item.net_weight,
            Charges: item.charges,
            "Paid Status": isPaid ? "Paid" : "Credit",
            "WhatsApp No": item.whatsapp,
        };
    })
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, "weighbridge-report.xlsx");
  };
  
  const unPaidRecords = data.filter(item => item.paid_status === false).length;


  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row flex-wrap items-center gap-2 w-full">
           {user?.role === 'developer' && (
                <div className="w-full md:w-auto md:min-w-[200px]">
                    <Select onValueChange={setSelectedWbNumber} value={selectedWbNumber}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an entity..." />
                        </SelectTrigger>
                        <SelectContent>
                            {entities.map(entity => (
                                <SelectItem key={entity.id} value={entity.mobileNumber}>
                                    {entity.companyName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full md:w-[300px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter by vehicle..."
              className="pl-8 w-full md:w-[250px]"
              value={vehicleNumberFilter}
              onChange={(e) => setVehicleNumberFilter(e.target.value.toUpperCase())}
            />
          </div>
           <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter by party name..."
              className="pl-8 w-full md:w-[250px]"
              value={partyNameFilter}
              onChange={(e) => setPartyNameFilter(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
          <Button onClick={handleExportPDF} variant="outline" className="w-full" disabled={data.length === 0}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="w-full" disabled={data.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>
       {selectedRows.size > 0 && (
          <div className="flex items-center gap-4">
             <Button
                onClick={handleUpdatePayment}
                disabled={isUpdating || selectedRows.size === 0}
              >
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard />}
                 Update to Paid ({selectedRows.size})
              </Button>
          </div>
        )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                    checked={selectedRows.size > 0 && selectedRows.size === unPaidRecords && unPaidRecords > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all unpaid rows"
                    disabled={unPaidRecords === 0}
                />
              </TableHead>
              <TableHead>Sl. No</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Vehicle No</TableHead>
              <TableHead>Party Name</TableHead>
              <TableHead>1st Wt</TableHead>
              <TableHead>2nd Wt</TableHead>
              <TableHead>Net Wt</TableHead>
              <TableHead>Charges</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((item) => {
                const isPaid = item.paid_status !== false;
                return (
                <TableRow key={item._id} data-state={selectedRows.has(item.sl_no) && "selected"}>
                  <TableCell>
                     <Checkbox
                        checked={selectedRows.has(item.sl_no)}
                        onCheckedChange={() => handleRowSelect(item.sl_no)}
                        aria-label={`Select row ${item.sl_no}`}
                        disabled={isPaid}
                      />
                  </TableCell>
                  <TableCell className="font-medium">{item.sl_no}</TableCell>
                  <TableCell>
                    {item.date} {item.time}
                  </TableCell>
                  <TableCell>{item.vehicle_no}</TableCell>
                  <TableCell>{item.party_name}</TableCell>
                  <TableCell>{item.first_weight}</TableCell>
                  <TableCell>{item.second_weight}</TableCell>
                  <TableCell>{item.net_weight}</TableCell>
                  <TableCell>{item.charges}</TableCell>
                  <TableCell>
                     <Badge variant={isPaid ? "secondary" : "destructive"}>
                        {isPaid ? "Paid" : "Credit"}
                     </Badge>
                  </TableCell>
                </TableRow>
              )})
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                   {user?.role === 'developer' && !selectedWbNumber 
                    ? "Please select an entity to view their report." 
                    : "No results found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
                <TableCell colSpan={8} className="font-bold text-right">Total Charges</TableCell>
                <TableCell className="font-bold text-left">{totalCharges.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}

    