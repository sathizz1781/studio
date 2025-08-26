
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import {
  Printer,
  Hash,
  Calendar,
  Clock,
  Truck,
  User,
  Package,
  CircleDollarSign,
  Weight,
  Scale,
  RefreshCcw,
  Edit,
  ChevronDown,
} from "lucide-react";
import { SerialDataComponent } from "./serial-data";

const formSchema = z.object({
  serialNumber: z.string().min(1, "Serial number is required."),
  dateTime: z.string().min(1, "Date and time are required."),
  vehicleNumber: z.string().min(1, "Vehicle number is required."),
  partyName: z.string().min(1, "Party name is required."),
  materialName: z.string().min(1, "Material name is required."),
  charges: z.coerce
    .number({ invalid_type_error: "Please enter a valid number." })
    .nonnegative("Charges must be a non-negative number.")
    .optional(),
  firstWeight: z.coerce
    .number({ invalid_type_error: "Please enter a valid number." })
    .nonnegative("Weight must be a positive number."),
  secondWeight: z.coerce
    .number({ invalid_type_error: "Please enter a valid number." })
    .nonnegative("Weight must be a positive number."),
  whatsappNumber: z.string().regex(/^\d{10,15}$/, {
    message: "Please enter a valid 10 to 15 digit phone number.",
  }).optional().or(z.literal('')),
  paymentStatus: z.enum(["Paid", "Credit"], {
    required_error: "You need to select a payment status.",
  }),
});

const WhatsAppIcon = (props) => (
  <svg role="img" viewBox="0 0 24 24" {...props}>
    <path
      d="M17.472 14.382c-.297-.149-.88-.436-1.017-.486s-.39-.074-.555.074-.35.486-.432.586-.165.111-.297.037s-1.24-.463-2.36-1.455c-.862-.772-1.45-1.725-1.62-2.023s-.17-.45-.074-.586c.074-.111.165-.24.24-.33s.111-.165.165-.278s.037-.24-.037-.35-.555-1.32-.732-1.808s-.35-.41-.486-.41h-.45c-.165 0-.41.074-.628.35s-.88.862-.88 2.1c0 1.238.905 2.437 1.037 2.613s1.77 2.71 4.3 3.822c.565.24.99.375 1.32.486.51.165.968.13 1.32-.074.39-.222.88-.905.99-1.238.111-.33.111-.615.074-.732zM12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18.13c-4.49 0-8.13-3.64-8.13-8.13s3.64-8.13 8.13-8.13 8.13 3.64 8.13 8.13-3.64 8.13-8.13 8.13z"
      fill="currentColor"
    />
  </svg>
);

export function WeighbridgeForm() {
  const [netWeight, setNetWeight] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [reprintSerial, setReprintSerial] = useState("");
  const [currentWeight, setCurrentWeight] = useState(0);
  const [isManualMode, setIsManualMode] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [previousWeights, setPreviousWeights] = useState(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const upiID = "sathishkumar1781@oksbi";
  const businessName = "Amman Weighing Home";
  const defaultUpiURL = `upi://pay?pa=${upiID}&pn=${encodeURIComponent(businessName)}&cu=INR`;

  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serialNumber: "",
      dateTime: "",
      vehicleNumber: "",
      partyName: "",
      materialName: "",
      charges: "",
      firstWeight: 0,
      secondWeight: 0,
      whatsappNumber: "",
      paymentStatus: "Paid",
    },
  });

  const { setValue, watch, getValues } = form;
  const firstWeight = watch("firstWeight");
  const secondWeight = watch("secondWeight");
  const charges = watch("charges");
  const serialNumber = watch("serialNumber");
  
  const fetchNewSerialNumber = useCallback(async () => {
    try {
      const response = await fetch("https://bend-mqjz.onrender.com/api/wb/getlastbill");
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setValue("serialNumber", (data.data.sl_no + 1).toString());
    } catch (error) {
      console.error("Error fetching last bill:", error);
      setValue("serialNumber", `WB-${Date.now().toString().slice(-6)}`);
    }
  }, [setValue]);

  const updateDateTime = useCallback(() => {
    const now = new Date();
    const formattedDateTime = now.toLocaleString("en-IN", {
      hour12: true,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
     if (!isManualMode) {
      setValue("dateTime", formattedDateTime);
    }
    setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: true }));
  }, [setValue, isManualMode]);
  
  const initializeForm = useCallback(() => {
    if (!isManualMode) {
      fetchNewSerialNumber();
    }
    updateDateTime();
  }, [isManualMode, fetchNewSerialNumber, updateDateTime]);

  useEffect(() => {
    setIsClient(true);
    initializeForm();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, [initializeForm]);


  useEffect(() => {
    if (typeof firstWeight !== "undefined" && typeof secondWeight !== "undefined") {
      const fw = Number(firstWeight) || 0;
      const sw = Number(secondWeight) || 0;
      const newNetWeight = Math.abs(fw - sw);
      setNetWeight(parseFloat(newNetWeight.toFixed(3)));
    }
  }, [firstWeight, secondWeight]);
  
  useEffect(() => {
    const numericCharges = Number(charges);
    if (numericCharges > 0) {
      const upiURL = `upi://pay?pa=${upiID}&pn=${encodeURIComponent(businessName)}&am=${numericCharges.toFixed(2)}&cu=INR`;
      const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiURL)}&size=128x128&margin=0`;
      setQrCodeUrl(apiUrl);
    } else {
        const defaultQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(defaultUpiURL)}&size=128x128&margin=0`;
        setQrCodeUrl(defaultQrCodeUrl);
    }
  }, [charges, defaultUpiURL, businessName, upiID]);

  const handlePrint = () => {
    window.print();
  };

  const handleReset = useCallback(() => {
    form.reset({
      vehicleNumber: "",
      partyName: "",
      materialName: "",
      charges: "",
      firstWeight: 0,
      secondWeight: 0,
      whatsappNumber: "",
      paymentStatus: "Paid",
    });
    setNetWeight(0);
    setPreviousWeights(null);
    if (isClient) {
      initializeForm();
    }
  }, [form, isClient, initializeForm]);

  const findBill = async () => {
    if (!isClient || !reprintSerial) return;
    try {
      const response = await fetch("https://bend-mqjz.onrender.com/api/wb/getbill", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billNo: reprintSerial }),
      });
      if (!response.ok) {
        throw new Error('Bill not found');
      }
      const result = await response.json();
      const billData = result.data;
      if (billData) {
        form.reset({
            serialNumber: billData.sl_no,
            dateTime: `${billData.date}, ${billData.time}`,
            vehicleNumber: billData.vehicle_no,
            partyName: billData.party_name,
            materialName: billData.material_name,
            charges: billData.charges,
            firstWeight: billData.first_weight,
            secondWeight: billData.second_weight,
            whatsappNumber: billData.whatsappNumber || "", 
            paymentStatus: billData.paid_status ? "Paid" : "Credit",
        });
        toast({ title: "Bill Found", description: `Data for bill ${reprintSerial} has been loaded.` });
      } else {
        toast({ variant: "destructive", title: "Bill Not Found", description: `No data found for serial number ${reprintSerial}.` });
      }
    } catch (error) {
      console.error("Failed to find bill:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not retrieve bill data." });
    }
  };
  
  const handleVehicleBlur = async () => {
    const vehicleNo = getValues("vehicleNumber");
    if (!vehicleNo) return;

    try {
      const response = await fetch("https://bend-mqjz.onrender.com/api/wb/getprevweightofvehicle", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleNo }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch previous weights.');
      }
      const result = await response.json();
      if (result.data && result.data.length > 0) {
        setPreviousWeights(result.data[0]);
        setIsPopoverOpen(true);
      } else {
        setPreviousWeights(null);
      }
    } catch (error) {
      console.error("Error fetching previous weights:", error);
      setPreviousWeights(null);
    }
  };
  
  const handleWeightSelection = (selectedWeight) => {
    const liveWeight = currentWeight;
    setValue("firstWeight", Math.max(selectedWeight, liveWeight));
    setValue("secondWeight", Math.min(selectedWeight, liveWeight));
    setIsPopoverOpen(false);
  };


  async function onSubmit(values) {
    const [date, time] = values.dateTime.split(', ');
    const billPayload = {
        sl_no: values.serialNumber,
        date: date,
        time: time,
        vehicle_no: values.vehicleNumber,
        party_name: values.partyName,
        material_name: values.materialName,
        charges: values.charges,
        first_weight: values.firstWeight,
        second_weight: values.secondWeight,
        net_weight: netWeight,
        paid_status: values.paymentStatus === "Paid",
    };
    
    try {
      const saveResponse = await fetch("https://bend-mqjz.onrender.com/api/wb/postbill", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billPayload),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.message || 'Failed to save the bill.');
      }


      let toastMessage = {
        title: "Bill Saved",
        description: "The bill has been saved and is ready for printing.",
      };

      if (values.whatsappNumber) {
        const message = `
*WeighBridge Bill*
-------------------------
*Serial No:* ${values.serialNumber}
*Date:* ${values.dateTime}
*Vehicle No:* ${values.vehicleNumber}
*Party Name:* ${values.partyName}
*Material:* ${values.materialName}
*Charges:* ₹${values.charges || 0}
*Payment:* ${values.paymentStatus}
*First Weight:* ${values.firstWeight} kg
*Second Weight:* ${values.secondWeight} kg
*Net Weight:* ${netWeight} kg
-------------------------
Thank you!
        `.trim();

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/91${values.whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, "_blank");

        toastMessage = {
          title: "Bill Saved & WhatsApp Ready",
          description: "Please press send in the newly opened WhatsApp tab.",
        };
      }
      
      toast(toastMessage);
      handlePrint();
      handleReset(); 

    } catch (error) {
      console.error("Failed to save or send bill:", error);
      toast({ variant: "destructive", title: "Error", description: `Could not save the bill. ${error.message}` });
    }
  }

  const BillContent = () => (
    <>
      <div className="mb-6">
        <Card>
            <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-center text-md sm:text-lg">Live Weight</CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-3">
                 <SerialDataComponent setCurrentWeight={setCurrentWeight} />
            </CardContent>
        </Card>
      </div>
       <div className="flex items-center justify-end space-x-2 mb-4">
          <Label htmlFor="manual-mode" className="flex items-center gap-2 text-sm">
            <Edit size={14} /> Manual Entry
          </Label>
          <Switch
            id="manual-mode"
            checked={isManualMode}
            onCheckedChange={(checked) => {
              setIsManualMode(checked);
              if (!checked) {
                // When turning off manual mode, re-initialize to get latest data
                fetchNewSerialNumber();
                updateDateTime();
              }
            }}
          />
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
                <FormItem className="sm:col-span-1">
                    <FormLabel className="flex items-center gap-2"><Hash className="h-5 w-5 text-primary" /> Serial Number</FormLabel>
                    <FormControl>
                        {isManualMode ? (
                            <Input {...field} />
                        ) : (
                            <p className="p-3 bg-muted rounded-lg text-lg font-bold text-foreground">{field.value}</p>
                        )}
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="dateTime"
            render={({ field }) => (
                <FormItem className="sm:col-span-2">
                    <FormLabel className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Date & Time</FormLabel>
                     <FormControl>
                        {isManualMode ? (
                            <Input {...field} />
                        ) : (
                             <p className="p-3 bg-muted rounded-lg text-sm text-foreground">{field.value}</p>
                        )}
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
      </div>


      <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 mb-6">
        <FormField
          control={form.control}
          name="vehicleNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Truck size={16} />
                Vehicle Number
              </FormLabel>
              <FormControl>
                <div className="relative flex items-center">
                    <Input
                      placeholder="e.g., MH12AB1234"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      onBlur={handleVehicleBlur}
                    />
                     {previousWeights && (
                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="absolute right-1 h-8 w-8">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2">
                             <div className="flex flex-col gap-2">
                               <p className="text-sm font-semibold">Select Previous Weight:</p>
                               <Button variant="outline" onClick={() => handleWeightSelection(previousWeights.first_weight)}>
                                 1st: {previousWeights.first_weight} kg
                               </Button>
                               <Button variant="outline" onClick={() => handleWeightSelection(previousWeights.second_weight)}>
                                 2nd: {previousWeights.second_weight} kg
                               </Button>
                               <Button variant="outline" onClick={() => handleWeightSelection(currentWeight)}>
                                  Use Live Wt: {currentWeight} kg
                               </Button>
                             </div>
                          </PopoverContent>
                        </Popover>
                      )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="partyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <User size={16} />
                Party Name
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="materialName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Package size={16} />
                Material Name
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., Sand, Gravel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="charges"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <CircleDollarSign size={16} />
                Charges (₹)
              </FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 250" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-x-8 gap-y-6">
        <FormField
          control={form.control}
          name="firstWeight"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Weight size={16} />
                First Weight (kg)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 5000"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="secondWeight"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Weight size={16} />
                Second Weight (kg)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 2000"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <Scale size={16} />
            Net Weight (kg)
          </FormLabel>
          <FormControl>
            <Input
              value={netWeight}
              disabled
              className="font-bold text-primary"
            />
          </FormControl>
        </FormItem>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-6">
         <FormField
          control={form.control}
          name="paymentStatus"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Payment Status</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex items-center space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Paid" />
                    </FormControl>
                    <FormLabel className="font-normal">Paid</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Credit" />
                    </FormControl>
                    <FormLabel className="font-normal">Credit</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {qrCodeUrl && (
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-medium text-accent mb-2">Scan to Pay</h3>
            <div className="bg-white p-2 rounded-lg border">
              <Image
                src={qrCodeUrl}
                alt="QR Code for UPI Payment"
                width={128}
                height={128}
                unoptimized
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Pay ₹{Number(charges) || "0"} using any UPI app
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              UPI ID: {upiID}
            </p>
          </div>
        )}
      </div>
    </>
  );

  const PrintableBill = () => {
    const values = getValues();
    return (
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-primary" />
          <p className="text-sm">
            <strong>Serial:</strong> {values.serialNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <p className="text-sm">
            <strong>Date:</strong> {values.dateTime}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <p className="text-sm">
            <strong>Vehicle:</strong> {values.vehicleNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <p className="text-sm">
            <strong>Party:</strong> {values.partyName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <p className="text-sm">
            <strong>Material:</strong> {values.materialName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CircleDollarSign className="h-5 w-5 text-primary" />
          <p className="text-sm">
            <strong>Charges:</strong> ₹{values.charges || 0}
          </p>
        </div>
          <div className="flex items-center gap-2">
          <CircleDollarSign className="h-5 w-5 text-primary" />
          <p className="text-sm">
            <strong>Status:</strong> {values.paymentStatus}
          </p>
        </div>
        <Separator className="my-1" />
        <div className="flex items-center gap-2">
          <Weight className="h-5 w-5" />
          <p className="text-sm">
            <strong>First Wt:</strong> {values.firstWeight} kg
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Weight className="h-5 w-5" />
          <p className="text-sm">
            <strong>Second Wt:</strong> {values.secondWeight} kg
          </p>
        </div>
        <Separator className="my-1" />
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <p className="text-sm">
            <strong>Net Wt:</strong> {netWeight} kg
          </p>
        </div>
        {qrCodeUrl && Number(charges) > 0 && (
          <div className="mt-2 flex flex-col items-center">
            <Image
              src={qrCodeUrl}
              alt="QR Code for UPI Payment"
              width={96}
              height={96}
              unoptimized
            />
          </div>
        )}
      </div>
    );
  }


  return (
    <Card className="w-full max-w-4xl printable-card shadow-2xl">
      <CardHeader className="no-print">
        <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-primary flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scale /> WeighBridge Biller
          </div>
           {isClient && <div className="text-lg font-mono text-accent">{currentTime}</div>}
        </CardTitle>
        <CardDescription>
          Fill in the details below to generate a new bill.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            {/* This is for the screen view */}
            <div className="no-print">
              <BillContent />
            </div>

            {/* This is for the print view only */}
            <div className="print-only printable-section">
              <div className="printable-content-wrapper">
                <PrintableBill />
              </div>
              <div className="printable-content-wrapper">
                <PrintableBill />
              </div>
              <div className="printable-content-wrapper">
                <PrintableBill />
              </div>
            </div>

            <Separator className="my-8 no-print" />

            {/* Non-Printable Section */}
            <div className="no-print">
              <h3 className="text-lg font-medium text-accent mb-2">
                Send via WhatsApp
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter a WhatsApp number to send the bill details.
              </p>
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <WhatsAppIcon className="h-4 w-4" />
                      WhatsApp Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row sm:flex-wrap justify-end gap-2 sm:gap-4 no-print mt-4">
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                   <RefreshCcw className="mr-2 h-4 w-4" />
                   Reprint Bill
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reprint Bill</AlertDialogTitle>
                  <AlertDialogDescription>
                    Enter the serial number of the bill you want to reprint.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex items-center space-x-2">
                    <Input 
                      id="reprint-serial" 
                      placeholder="e.g., WB-123456" 
                      value={reprintSerial}
                      onChange={(e) => setReprintSerial(e.target.value)}
                    />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={findBill}>Find Bill</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              type="submit"
              style={{
                backgroundColor: "hsl(var(--accent))",
                color: "hsl(var(--accent-foreground))",
              }}
               className="w-full sm:w-auto"
            >
              <Printer className="mr-2 h-4 w-4" />
              Send &amp; Print
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    

    