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
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Download,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// PDF and Excel libraries
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

export function ReportsTable() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  const [vehicleNumberFilter, setVehicleNumberFilter] = useState("");
  const [partyNameFilter, setPartyNameFilter] = useState("");
  const { toast } = useToast();

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = {
        // The API seems to expect DD/MM/YYYY format. date-fns uses 'dd/MM/yyyy'.
        startDate: dateRange?.from ? format(dateRange.from, "dd/MM/yyyy") : null,
        endDate: dateRange?.to ? format(dateRange.to, "dd/MM/yyyy") : null,
      };

      if (vehicleNumberFilter) {
        query.vehicleNo = vehicleNumberFilter;
      }
      
      if (partyNameFilter) {
        query.partyName = partyNameFilter; // Backend will handle regex
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

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: "Could not load reports. Please try again later.",
      });
      setData([]); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, vehicleNumberFilter, partyNameFilter, toast]);

  // Fetch data on initial load and when filters change
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const totalCharges = useMemo(() => {
    return data.reduce((total, item) => total + (Number(item.charges) || 0), 0);
  }, [data]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Weighbridge Report", 14, 16);
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
      body: data.map((item) => [
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
        item.paid_status ? "Paid" : "Credit",
      ]),
      startY: 20,
    });
    doc.save("weighbridge-report.pdf");
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((item) => ({
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
        "Paid Status": item.paid_status ? "Paid" : "Credit",
        "WhatsApp No": item.whatsapp,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, "weighbridge-report.xlsx");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row flex-wrap items-center gap-2 w-full">
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
          <Button onClick={handleExportPDF} variant="outline" className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell colSpan={9} className="h-24 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item._id}>
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
                     <Badge variant={item.paid_status ? "secondary" : "destructive"}>
                        {item.paid_status ? "Paid" : "Credit"}
                     </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
                <TableCell colSpan={7} className="font-bold text-right">Total Charges</TableCell>
                <TableCell className="font-bold text-left">{totalCharges.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
