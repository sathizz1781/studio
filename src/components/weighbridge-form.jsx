
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Calendar as CalendarIcon,
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
  Loader2,
  ArrowDown,
} from "lucide-react";
import { SerialDataComponent } from "./serial-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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

const LiveClock = () => {
  const [time, setTime] = useState("");
  useEffect(() => {
    // Set the initial time immediately
    setTime(new Date().toLocaleTimeString('en-IN', { hour12: true }));
    // Then set up the interval to update it
    const timerId = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour12: true }));
    }, 1000);
    return () => clearInterval(timerId);
  }, []);
  return <div className="text-lg font-mono text-accent">{time}</div>;
};

export function WeighbridgeForm() {
  const [netWeight, setNetWeight] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [reprintSerial, setReprintSerial] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);
  const [previousWeights, setPreviousWeights] = useState(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);
  const [isLoadingReprint, setIsLoadingReprint] = useState(false);
  const [reprintData, setReprintData] = useState(null);
  const [isReprintDialogOpen, setIsReprintDialogOpen] = useState(false);

  // State for pull-to-refresh
  const [pullPosition, setPullPosition] = useState(-50);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const PULL_THRESHOLD = 70; // How far the user needs to pull down in px

  const serialDataRef = useRef({ weight: 0 });

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

  const { setValue, watch, getValues, reset, control } = form;
  const firstWeight = watch("firstWeight");
  const secondWeight = watch("secondWeight");
  const charges = watch("charges");
  
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

  const setInitialDateTime = useCallback(() => {
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
    setValue("dateTime", formattedDateTime);
  }, [setValue]);
  
  const initializeForm = useCallback(() => {
    fetchNewSerialNumber();
    setInitialDateTime();
  }, [fetchNewSerialNumber, setInitialDateTime]);

  useEffect(() => {
    setIsClient(true);
    initializeForm();
  }, [initializeForm]);

  useEffect(() => {
    const fw = Number(firstWeight) || 0;
    const sw = Number(secondWeight) || 0;
    const newNetWeight = Math.abs(fw - sw);
    setNetWeight(parseFloat(newNetWeight.toFixed(3)));
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
    reset({
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
  }, [reset, isClient, initializeForm]);

  const findBill = async () => {
    if (!isClient || !reprintSerial) return;
    setIsLoadingReprint(true);
    try {
      const response = await fetch("https://bend-mqjz.onrender.com/api/wb/getsinglerecords", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sl_no: Number(reprintSerial) }),
      });
      
      if (!response.ok) {
        if(response.status === 404) {
             toast({ variant: "destructive", title: "Bill Not Found", description: `No data found for serial number ${reprintSerial}.` });
        } else {
            throw new Error('Failed to fetch bill');
        }
        return;
      }

      const result = await response.json();
      if (result.data) {
        setReprintData(result.data);
        setIsReprintDialogOpen(true);
        toast({ title: "Bill Found", description: `Data for bill ${reprintSerial} has been loaded.` });
      } else {
        toast({ variant: "destructive", title: "Bill Not Found", description: `No data found for serial number ${reprintSerial}.` });
      }
    } catch (error) {
      console.error("Failed to find bill:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not retrieve bill data." });
    } finally {
        setIsLoadingReprint(false);
    }
  };
  
  const handleVehicleBlur = async (e) => {
    const vehicleNo = e.target.value;
    if (!vehicleNo) {
      setPreviousWeights(null);
      setIsPopoverOpen(false);
      return;
    }
    
    setIsLoadingVehicle(true);

    try {
      const response = await fetch("https://bend-mqjz.onrender.com/api/wb/getprevweightofvehicle", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleNo }),
      });
      
      if (!response.ok) {
        setPreviousWeights(null);
        setIsPopoverOpen(false);
        return;
      }

      const result = await response.json();
      if (result.data && result.data.length > 0) {
        setPreviousWeights(result.data[0]);
        setIsPopoverOpen(true);
      } else {
        setPreviousWeights(null);
        setIsPopoverOpen(false);
      }
    } catch (error) {
      console.error("Error fetching previous weights:", error);
      setPreviousWeights(null);
      setIsPopoverOpen(false);
    } finally {
        setIsLoadingVehicle(false);
    }
  };
  
  const handleWeightSelection = (selectedWeight) => {
    const liveWeight = serialDataRef.current.weight;
    setValue("firstWeight", Math.max(selectedWeight, liveWeight));
    setValue("secondWeight", Math.min(selectedWeight, liveWeight));
    setIsPopoverOpen(false);
  };


  async function onSubmit(values) {
    const [date, time] = values.dateTime.split(', ');
    
    const billPayload = {
      billNo: Number(values.serialNumber),
      date: date,
      time: time,
      vehicleNo: values.vehicleNumber,
      material: values.materialName,
      party: values.partyName,
      charges: values.charges || 0,
      paidStatus: values.paymentStatus === "Paid",
      firstWeight: values.firstWeight,
      secondWeight: values.secondWeight,
      netWeight: netWeight,
      whatsappNumber: values.whatsappNumber || "",
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

  // Pull to refresh handlers
  const handleTouchStart = (e) => {
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const touchY = e.targetTouches[0].clientY;
    const pullDistance = touchY - touchStartY.current;

    if (window.scrollY === 0 && pullDistance > 0) {
      // Prevent default browser refresh action
      e.preventDefault();
      const newPullPosition = Math.min(pullDistance, PULL_THRESHOLD + 20) - 50;
      setPullPosition(newPullPosition);
      
      if (pullDistance > PULL_THRESHOLD) {
        setIsRefreshing(true);
      }
    }
  };

  const handleTouchEnd = () => {
    if (isRefreshing) {
      handleReset();
      toast({ title: "Refreshed", description: "New bill ready." });
    }
    // Reset states
    setIsRefreshing(false);
    setPullPosition(-50);
    touchStartY.current = 0;
  };

  const BillContent = () => (
    <>
      <div className="mb-6">
        <Card>
            <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-center text-md sm:text-lg">Live Weight</CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-3">
                 <SerialDataComponent serialDataRef={serialDataRef} />
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
                setInitialDateTime();
              }
            }}
          />
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <FormField
            control={control}
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
            control={control}
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
          control={control}
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
                     {isLoadingVehicle && (
                        <div className="absolute right-10 flex items-center pr-3 pointer-events-none">
                            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                        </div>
                     )}
                     {previousWeights && !isLoadingVehicle && (
                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="absolute right-1 h-8 w-8">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-4">
                            <div className="flex flex-col gap-3">
                                <p className="text-sm font-semibold">Previous Entry Found:</p>
                                <div className="text-xs text-muted-foreground">
                                    <p><strong>Bill:</strong> {previousWeights.sl_no}</p>
                                    <p><strong>Date:</strong> {previousWeights.date} {previousWeights.time}</p>
                                </div>
                                <Button variant="outline" onClick={() => handleWeightSelection(previousWeights.first_weight)}>
                                 1st: {previousWeights.first_weight} kg
                                </Button>
                                <Button variant="outline" onClick={() => handleWeightSelection(previousWeights.second_weight)}>
                                 2nd: {previousWeights.second_weight} kg
                                </Button>
                                <Button variant="secondary" onClick={() => handleWeightSelection(serialDataRef.current.weight)}>
                                  Use Live: {serialDataRef.current.weight} kg
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
          control={control}
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
          control={control}
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
          control={control}
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
          control={control}
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
          control={control}
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
          control={control}
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

  const PrintableBill = ({billData, netWt}) => {
    const values = billData || getValues();
    const currentNetWeight = netWt !== undefined ? netWt : netWeight;
    const paymentStatus = values.paidStatus !== undefined ? (values.paid_status ? "Paid" : "Credit") : values.paymentStatus;
    
    return (
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-primary" />
          <p className="text-sm">
            <strong>Serial:</strong> {values.sl_no || values.serialNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <p className="text-sm">
            <strong>Date:</strong> {values.dateTime || `${values.date}, ${values.time}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <p className="text-sm">
            <strong>Vehicle:</strong> {values.vehicle_no || values.vehicleNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <p className="text-sm">
            <strong>Party:</strong> {values.party_name || values.partyName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <p className="text-sm">
            <strong>Material:</strong> {values.material_name || values.materialName}
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
            <strong>Status:</strong> {paymentStatus}
          </p>
        </div>
        <Separator className="my-1" />
        <div className="flex items-center gap-2">
          <Weight className="h-5 w-5" />
          <p className="text-sm">
            <strong>First Wt:</strong> {values.first_weight || values.firstWeight} kg
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Weight className="h-5 w-5" />
          <p className="text-sm">
            <strong>Second Wt:</strong> {values.second_weight || values.secondWeight} kg
          </p>
        </div>
        <Separator className="my-1" />
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <p className="text-sm">
            <strong>Net Wt:</strong> {values.net_weight || currentNetWeight} kg
          </p>
        </div>
        {qrCodeUrl && Number(values.charges) > 0 && (
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

  const ReprintDialog = () => {
      const handleReprintPrint = () => {
          const printWindow = window.open('', '_blank');
          printWindow.document.write('<html><head><title>Print Bill</title>');
          printWindow.document.write(`
              <style>
                  body { font-family: sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  @page { size: auto; margin: 0mm; }
                  .printable-section { display: flex; flex-direction: row; justify-content: space-between; gap: 0.5rem; width: 100%; }
                  .printable-content-wrapper { flex: 1 1 32%; min-width: 0; border: 1px dashed #ccc; padding: 0.5rem; font-size: 9px; }
                  .text-primary { color: #4f46e5; }
                  .separator { border-top: 1px solid #eee; margin: 4px 0; }
                  .flex { display: flex; align-items: center; }
                  .gap-2 { gap: 0.5rem; }
                  .h-5 { height: 12px; } .w-5 { width: 12px; }
                  .grid { display: grid; } .gap-4 { gap: 1rem; }
                  .text-sm { font-size: 9px; } 
                  p { margin: 0; }
                  strong { font-weight: bold; }
              </style>
          `);
          printWindow.document.write('</head><body>');
  
          // Create a container for the printable content
          const container = document.createElement('div');
          
          const printableContent = (
              <div className="printable-section">
                  <div className="printable-content-wrapper"><PrintableBill billData={reprintData} /></div>
                  <div className="printable-content-wrapper"><PrintableBill billData={reprintData} /></div>
                  <div className="printable-content-wrapper"><PrintableBill billData={reprintData} /></div>
              </div>
          );
  
          // Use ReactDOMServer to render the React component to a static HTML string
          const ReactDOMServer = require('react-dom/server');
          printWindow.document.write(ReactDOMServer.renderToStaticMarkup(printableContent));
  
          printWindow.document.write('</body></html>');
          printWindow.document.close();
          printWindow.focus();
          // Use a timeout to ensure content is loaded before printing
          setTimeout(() => {
              printWindow.print();
              printWindow.close();
          }, 250);
      };
  
      if (!reprintData) return null;
  
      return (
          <Dialog open={isReprintDialogOpen} onOpenChange={setIsReprintDialogOpen}>
              <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                      <DialogTitle>Reprint Bill #{reprintData.sl_no}</DialogTitle>
                      <DialogDescription>
                          Confirm the details below before re-printing.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 text-sm">
                      <p><strong>Date:</strong> {reprintData.date} {reprintData.time}</p>
                      <p><strong>Vehicle:</strong> {reprintData.vehicle_no}</p>
                      <p><strong>Party:</strong> {reprintData.party_name}</p>
                      <p><strong>Net Weight:</strong> {reprintData.net_weight} kg</p>
                  </div>
                  <DialogFooter className="sm:justify-end">
                       <Button type="button" variant="secondary" onClick={() => setIsReprintDialogOpen(false)}>Close</Button>
                       <Button type="button" onClick={handleReprintPrint}>
                           <Printer className="mr-2 h-4 w-4" />
                           Print
                       </Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      );
  };


  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 text-muted-foreground transition-all duration-200"
        style={{ top: `${pullPosition}px` }}
      >
        {isRefreshing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowDown className="h-5 w-5" />}
        <span className="text-sm">{isRefreshing ? 'Refreshing...' : 'Pull to refresh'}</span>
      </div>

      <Card className="w-full max-w-4xl printable-card shadow-2xl">
        <CardHeader className="no-print">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-primary flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Scale /> WeighBridge Biller
            </div>
            {isClient && <LiveClock />}
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
                  control={control}
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
                        type="number"
                        placeholder="e.g., 123456" 
                        value={reprintSerial}
                        onChange={(e) => setReprintSerial(e.target.value)}
                      />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                       findBill();
                       // We need to close the alert dialog ourselves
                       // as it does not close on its own when an action is taken.
                       // A bit of a hack: find the cancel button and click it programmatically
                       // This is needed because the reprint logic opens another dialog.
                       document.querySelector('[data-radix-collection-item] button[aria-label="Cancel"]')?.click();
                    }} disabled={isLoadingReprint}>
                      {isLoadingReprint && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Find Bill
                    </AlertDialogAction>
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
      {isReprintDialogOpen && <ReprintDialog />}
    </div>
  );
}

    