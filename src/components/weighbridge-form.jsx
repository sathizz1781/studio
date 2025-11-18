
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import {
  Printer,
  Hash,
  Clock,
  Truck,
  User,
  Package,
  CircleDollarSign,
  Weight,
  Scale,
  RefreshCcw,
  Edit,
  Loader2,
  BarChart2,
  Users,
  Check,
  ChevronsUpDown,
  Share2,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { SerialDataComponent } from "./serial-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils";
import { useAppContext } from "@/app/layout";

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
  customerId: z.string().optional(),
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
    setTime(new Date().toLocaleTimeString('en-IN', { hour12: true }));
    const timerId = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour12: true }));
    }, 1000);
    return () => clearInterval(timerId);
  }, []);
  return <div className="text-lg font-mono text-accent">{time}</div>;
};

const GoogleMapView = ({ latitude, longitude, className, translations }) => {
    if (!latitude || !longitude) {
        return null;
    }

    const mapSrc = `https://www.google.com/maps?q=${latitude},${longitude}&hl=es;z=14&output=embed`;
    
    return (
      <div className={cn("space-y-2", className)}>
        <Label>{translations.weighbridge_form.customer_location}</Label>
        <div className="aspect-video w-full rounded-md overflow-hidden border">
           <iframe
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              src={mapSrc}
              title="Customer Location"
            >
          </iframe>
        </div>
      </div>
       
    );
};

const ShareLocationDialog = ({ isOpen, onOpenChange, customer, toast, translations }) => {
    const [shareWhatsappNumber, setShareWhatsappNumber] = useState("");

    const handleShareLocationViaWhatsapp = () => {
        if (!customer || !customer.latitude || !customer.longitude) return;

        if (!shareWhatsappNumber || !/^\d{10,15}$/.test(shareWhatsappNumber)) {
            toast({
                variant: "destructive",
                title: "Invalid Number",
                description: "Please enter a valid WhatsApp number.",
            });
            return;
        }

        const url = `https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`;
        const message = `Here is the location: ${url}`;
        const whatsappUrl = `https://wa.me/91${shareWhatsappNumber}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, "_blank");
        onOpenChange(false);
        setShareWhatsappNumber("");
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{translations.weighbridge_form.share_location}</DialogTitle>
                    <DialogDescription>
                        {translations.weighbridge_form.share_location_description}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="whatsapp-share-number">{translations.weighbridge_form.whatsapp_number}</Label>
                    <Input
                        id="whatsapp-share-number"
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={shareWhatsappNumber}
                        onChange={(e) => setShareWhatsappNumber(e.target.value)}
                    />
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                        {translations.weighbridge_form.cancel}
                    </Button>
                    <Button type="button" onClick={handleShareLocationViaWhatsapp}>
                        <WhatsAppIcon className="mr-2 h-4 w-4" /> {translations.weighbridge_form.send}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const PrintableBill = React.forwardRef(({ billData }, ref) => {
  const {
    sl_no,
    date,
    time,
    vehicle_no,
    material_name,
    party_name,
    charges,
    first_weight,
    second_weight,
    net_weight,
  } = billData;

  const content = (
    <div>
      <table style={{ fontSize: '10px', width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr><td style={{ padding: '1px', textAlign: 'right' }}>{sl_no}</td></tr>
          <tr><td style={{ padding: '1px', textAlign: 'right' }}>{date}</td></tr>
          <tr><td style={{ padding: '1px', textAlign: 'right' }}>{time}</td></tr>
          <tr><td style={{ padding: '1px', textAlign: 'right' }}>{vehicle_no}</td></tr>
          <tr><td style={{ padding: '1px', textAlign: 'right' }}>{party_name}</td></tr>
          <tr><td style={{ padding: '1px', textAlign: 'right' }}>{material_name}</td></tr>
          <tr><td style={{ padding: '1px', textAlign: 'right' }}>{charges}</td></tr>
          <tr><td style={{ padding: '1px', paddingTop: '2px', textAlign: 'right' }}>{first_weight}</td></tr>
          <tr><td style={{ padding: '1px', textAlign: 'right' }}>{second_weight}</td></tr>
          <tr><td style={{ padding: '1px', textAlign: 'right' }}>{net_weight}</td></tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div ref={ref} className="printable-section">
      <div className="printable-content-wrapper">{content}</div>
      <div className="printable-content-wrapper">{content}</div>
      <div className="printable-content-wrapper">{content}</div>
    </div>
  );
});
PrintableBill.displayName = 'PrintableBill';

const BillContent = ({
  form,
  serialDataRef,
  isManualMode,
  setIsManualMode,
  fetchNewSerialNumber,
  setInitialDateTime,
  handleVehicleBlur,
  isLoadingVehicle,
  previousWeights,
  handleWeightSelection,
  chargeExtremes,
  handleChargeSelection,
  isCustomerPopoverOpen,
  setIsCustomerPopoverOpen,
  selectedCustomerForDisplay,
  customers,
  handleCustomerSelect,
  netWeight,
  charges,
  qrCodeUrl,
  setIsShareLocationOpen,
  translations,
}) => {
  const { control } = form;
  return (
    <>
      <div className="mb-6">
        <Card>
            <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-center text-md sm:text-lg">{translations.weighbridge_form.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-3">
                 <SerialDataComponent serialDataRef={serialDataRef} />
            </CardContent>
        </Card>
      </div>
       <div className="flex items-center justify-end space-x-2 mb-4">
          <Label htmlFor="manual-mode" className="flex items-center gap-2 text-sm">
            <Edit size={14} /> {translations.weighbridge_form.manual_entry}
          </Label>
          <Switch
            id="manual-mode"
            checked={isManualMode}
            onCheckedChange={(checked) => {
              setIsManualMode(checked);
              if (!checked) {
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
                    <FormLabel className="flex items-center gap-2"><Hash className="h-5 w-5 text-primary" /> {translations.weighbridge_form.serial_number}</FormLabel>
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
                    <FormLabel className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> {translations.weighbridge_form.date_time}</FormLabel>
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
      
       <div className="space-y-2 no-print mb-6">
          <Label className="flex items-center gap-2"><Users size={16} /> {translations.weighbridge_form.select_customer}</Label>
          <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
              <PopoverTrigger asChild>
                  <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                  >
                      {selectedCustomerForDisplay
                          ? selectedCustomerForDisplay.companyName
                          : translations.weighbridge_form.select_customer}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                      <CommandInput placeholder={translations.weighbridge_form.search_customer} />
                      <CommandList>
                          <CommandEmpty>{translations.weighbridge_form.no_customer_found}</CommandEmpty>
                          <CommandGroup>
                              {customers.map((customer) => (
                                  <CommandItem
                                      key={customer.customerId}
                                      value={customer.companyName}
                                      onSelect={() => handleCustomerSelect(customer.customerId)}
                                  >
                                      <Check
                                          className={cn(
                                              "mr-2 h-4 w-4",
                                              selectedCustomerForDisplay?.customerId === customer.customerId ? "opacity-100" : "opacity-0"
                                          )}
                                      />
                                      {customer.companyName}
                                  </CommandItem>
                              ))}
                          </CommandGroup>
                      </CommandList>
                  </Command>
              </PopoverContent>
          </Popover>
      </div>


      <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 mb-6">
        <FormField
          control={control}
          name="vehicleNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Truck size={16} />
                {translations.weighbridge_form.vehicle_number}
              </FormLabel>
              <FormControl>
                 <Popover open={!!previousWeights} onOpenChange={(isOpen) => !isOpen && setPreviousWeights(null)}>
                    <PopoverTrigger asChild>
                        <div className="relative flex items-center">
                            <Input
                              placeholder="e.g., TN39BY5131"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              onBlur={handleVehicleBlur}
                            />
                             {isLoadingVehicle && (
                                <div className="absolute right-2 flex items-center pr-3 pointer-events-none">
                                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                                </div>
                             )}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" onOpenAutoFocus={(e) => e.preventDefault()}>
                      {previousWeights && (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm font-semibold">{translations.weighbridge_form.previous_entry_found}</p>
                            <div className="text-xs text-muted-foreground">
                                <p><strong>{translations.weighbridge_form.bill}:</strong> {previousWeights.sl_no}</p>
                                <p><strong>{translations.weighbridge_form.date}:</strong> {previousWeights.date} {previousWeights.time}</p>
                            </div>
                            <Button variant="outline" onClick={() => handleWeightSelection(previousWeights.first_weight)}>
                             1st: {previousWeights.first_weight}
                            </Button>
                            <Button variant="outline" onClick={() => handleWeightSelection(previousWeights.second_weight)}>
                             2nd: {previousWeights.second_weight}
                            </Button>
                            <Button variant="secondary" onClick={() => handleWeightSelection(serialDataRef.current.weight)}>
                              {translations.weighbridge_form.use_live}: {serialDataRef.current.weight}
                            </Button>
                        </div>
                      )}
                    </PopoverContent>
                 </Popover>
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
                {translations.weighbridge_form.party_name}
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
                {translations.weighbridge_form.material_name}
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
                {translations.weighbridge_form.charges}
              </FormLabel>
               <FormControl>
                 <Popover open={!!chargeExtremes} onOpenChange={(isOpen) => !isOpen && setChargeExtremes(null)}>
                    <PopoverTrigger asChild>
                        <div className="relative flex items-center">
                            <Input type="number" placeholder="e.g., 250" {...field} />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" onOpenAutoFocus={(e) => e.preventDefault()}>
                      {chargeExtremes && (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm font-semibold">{translations.weighbridge_form.charge_suggestions}</p>
                            {chargeExtremes.highest && (
                                 <Button variant="outline" className="justify-between gap-4" onClick={() => handleChargeSelection(chargeExtremes.highest.charges)}>
                                     <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-green-500"/> {translations.weighbridge_form.highest}: 
                                     </div>
                                      <span>₹{chargeExtremes.highest.charges}</span>
                                 </Button>
                            )}
                            {chargeExtremes.lowest && (
                                 <Button variant="outline" className="justify-between gap-4" onClick={() => handleChargeSelection(chargeExtremes.lowest.charges)}>
                                     <div className="flex items-center gap-2">
                                         <TrendingDown className="h-4 w-4 text-red-500"/> {translations.weighbridge_form.lowest}:
                                     </div>
                                      <span>₹{chargeExtremes.lowest.charges}</span>
                                 </Button>
                            )}
                        </div>
                      )}
                    </PopoverContent>
                 </Popover>
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
                {translations.weighbridge_form.first_weight}
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
                {translations.weighbridge_form.second_weight}
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
            {translations.weighbridge_form.net_weight}
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

      <div className="flex flex-col md:flex-row items-start justify-between mt-6 gap-6 no-print">
         <div className="flex-1 space-y-4">
            <FormField
              control={control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{translations.weighbridge_form.payment_status}</FormLabel>
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
                        <FormLabel className="font-normal">{translations.weighbridge_form.paid}</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Credit" />
                        </FormControl>
                        <FormLabel className="font-normal">{translations.weighbridge_form.credit}</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={control}
                name="whatsappNumber"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center gap-2">
                    <WhatsAppIcon className="h-4 w-4" />
                    {translations.weighbridge_form.whatsapp_number}
                    </FormLabel>
                    <FormControl>
                    <Input placeholder="e.g., 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
         </div>

        <div className="flex-1 grid grid-cols-2 gap-4">
            {qrCodeUrl && (
              <div className="flex flex-col items-center space-y-2">
                <h3 className="text-sm font-medium text-accent">{translations.weighbridge_form.scan_to_pay}</h3>
                <div className="bg-white p-2 rounded-lg border">
                  <Image
                    src={qrCodeUrl}
                    alt="QR Code for UPI Payment"
                    width={128}
                    height={128}
                    unoptimized
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {translations.weighbridge_form.pay_via_upi.replace('{amount}', Number(charges) || "0")}
                </p>
              </div>
            )}
             {selectedCustomerForDisplay && selectedCustomerForDisplay.latitude && selectedCustomerForDisplay.longitude && (
                <div className="no-print space-y-2">
                     <GoogleMapView latitude={selectedCustomerForDisplay.latitude} longitude={selectedCustomerForDisplay.longitude} translations={translations} />
                     <Button variant="outline" size="sm" className="w-full" onClick={() => setIsShareLocationOpen(true)}>
                        <Share2 className="mr-2 h-3 w-3" />
                        {translations.weighbridge_form.share_location}
                     </Button>
                </div>
             )}
        </div>
      </div>
    </>
  );
};
  
const ReprintDialog = ({ isOpen, onOpenChange, reprintData, toast, config }) => {
    const handleReprintPrint = () => {
        if (!reprintData) return;
        const printWindow = window.open('', '_blank', 'width=1000,height=700');
        if (!printWindow) {
             toast({ variant: "destructive", title: "Popup Blocked", description: "Please allow popups for this site to print." });
            return;
        }

        const ReactDOMServer = require('react-dom/server');
        
        const billHtml = ReactDOMServer.renderToStaticMarkup(<PrintableBill billData={reprintData} />);

        printWindow.document.write('<html><head><title>Print Bill</title>');
        printWindow.document.write(`<style>${document.getElementById('global-styles-for-print').innerHTML}</style>`);
        printWindow.document.write('</head><body>');
        printWindow.document.write(billHtml);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    if (!reprintData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Reprint Bill #{reprintData.sl_no}</DialogTitle>
                    <DialogDescription>
                        Confirm the details below before re-printing.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-4 text-sm space-y-1">
                    <p><strong>Date & Time:</strong> {reprintData.date} {reprintData.time}</p>
                    <p><strong>Vehicle No:</strong> {reprintData.vehicle_no}</p>
                    <p><strong>Party Name:</strong> {reprintData.party_name}</p>
                    <p><strong>Material:</strong> {reprintData.material_name}</p>
                    <p><strong>Charges:</strong> ₹{reprintData.charges}</p>
                    <p><strong>1st Weight:</strong> {reprintData.first_weight} kg</p>
                    <p><strong>2nd Weight:</strong> {reprintData.second_weight} kg</p>
                    <p><strong>Net Weight:</strong> {reprintData.net_weight} kg</p>
                    <p><strong>Status:</strong> {reprintData.paid_status ? 'Paid' : 'Credit'}</p>
                </div>
                <DialogFooter className="sm:justify-end">
                     <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
                     <Button type="button" onClick={handleReprintPrint}>
                         <Printer className="mr-2 h-4 w-4" />
                         Print
                     </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export function WeighbridgeForm() {
  const { translations, config } = useAppContext();
  const [netWeight, setNetWeight] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [reprintSerial, setReprintSerial] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);
  const [previousWeights, setPreviousWeights] = useState(null);
  const [chargeExtremes, setChargeExtremes] = useState(null);
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);
  const [isLoadingReprint, setIsLoadingReprint] = useState(false);
  const [reprintData, setReprintData] = useState(null);
  const [isReprintDialogOpen, setIsReprintDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerForDisplay, setSelectedCustomerForDisplay] = useState(null);
  const [isShareLocationOpen, setIsShareLocationOpen] = useState(false);
  
  const touchStartY = useRef(0);
  const PULL_THRESHOLD = 70;

  const serialDataRef = useRef({ weight: 0 });

  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
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
      customerId: "",
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
      const lastSerialNumber = data?.data?.sl_no;
      const nextSerialNumber = (typeof lastSerialNumber === 'number' && !isNaN(lastSerialNumber))
        ? lastSerialNumber + 1
        : 1;
      setValue("serialNumber", nextSerialNumber.toString());
    } catch (error) {
      console.error("Error fetching last bill:", error);
      setValue("serialNumber", "1");
    }
  }, [setValue]);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch("https://bend-mqjz.onrender.com/api/user/userlist");
      if(response.ok) {
        const data = await response.json();
        setCustomers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      setCustomers([]);
    }
  }, []);

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
    fetchCustomers();
  }, [fetchNewSerialNumber, setInitialDateTime, fetchCustomers]);

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
    const upiID = config.upiId || "default@upi";
    const businessName = config.companyName || "My Company";
    const defaultUpiURL = `upi://pay?pa=${upiID}&pn=${encodeURIComponent(businessName)}&cu=INR`;

    const numericCharges = Number(charges);
    if (numericCharges > 0) {
      const upiURL = `upi://pay?pa=${upiID}&pn=${encodeURIComponent(businessName)}&am=${numericCharges.toFixed(2)}&cu=INR`;
      const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiURL)}&size=128x128&margin=0}`;
      setQrCodeUrl(apiUrl);
    } else {
        const defaultQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(defaultUpiURL)}&size=128x128&margin=0`;
        setQrCodeUrl(defaultQrCodeUrl);
    }
  }, [charges, config]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!printWindow) {
      toast({ variant: "destructive", title: "Popup Blocked", description: "Please allow popups for this site to print." });
      return;
    }

    const latestValues = getValues();
    const [date, time] = latestValues.dateTime.split(', ');
    const billData = {
      sl_no: latestValues.serialNumber,
      date: date,
      time: time,
      vehicle_no: latestValues.vehicleNumber,
      material_name: latestValues.materialName,
      party_name: latestValues.partyName,
      charges: latestValues.charges,
      first_weight: latestValues.firstWeight,
      second_weight: latestValues.secondWeight,
      net_weight: netWeight,
    };

    const ReactDOMServer = require('react-dom/server');
    
    const billHtml = ReactDOMServer.renderToStaticMarkup(<PrintableBill billData={billData} />);
    
    printWindow.document.write('<html><head><title>Print Bill</title>');
    printWindow.document.write(`<style>${document.getElementById('global-styles-for-print').innerHTML}</style>`);
    printWindow.document.write('</head><body>');
    printWindow.document.write(billHtml);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
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
      customerId: ""
    });
    setNetWeight(0);
    setPreviousWeights(null);
    setSelectedCustomerForDisplay(null);
    setChargeExtremes(null);
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
    if (!vehicleNo || vehicleNo.length < 4) {
      setPreviousWeights(null);
      setChargeExtremes(null);
      return;
    }
    
    setIsLoadingVehicle(true);

    try {
        const [weightsResponse, chargesResponse] = await Promise.all([
            fetch("https://bend-mqjz.onrender.com/api/wb/getprevweightofvehicle", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vehicleNo }),
            }),
            fetch(`https://bend-mqjz.onrender.com/api/wb/getchargeextremes/${vehicleNo}`)
        ]);

        if (weightsResponse.ok) {
            const result = await weightsResponse.json();
            if (result.data) {
                setPreviousWeights(result.data);
            } else {
               setPreviousWeights(null);
            }
        } else {
           setPreviousWeights(null);
        }

        if (chargesResponse.ok) {
            const result = await chargesResponse.json();
            if (result.data && (result.data.highest || result.data.lowest)) {
                setChargeExtremes(result.data);
            } else {
                setChargeExtremes(null);
            }
        } else {
            setChargeExtremes(null);
        }

    } catch (error) {
        console.error("Error fetching vehicle data:", error);
        setPreviousWeights(null);
        setChargeExtremes(null);
    } finally {
        setIsLoadingVehicle(false);
    }
  };
  
  const handleWeightSelection = (selectedWeight) => {
    const liveWeight = serialDataRef.current.weight;
    setValue("firstWeight", Math.max(selectedWeight, liveWeight));
    setValue("secondWeight", Math.min(selectedWeight, liveWeight));
    setPreviousWeights(null);
  };

  const handleChargeSelection = (charge) => {
    setValue("charges", charge);
    setChargeExtremes(null);
  }

  async function onSubmit(values) {
    const now = new Date();
    const currentDateTime = now.toLocaleString("en-IN", {
        hour12: true,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    // Set value right before submission to ensure it's current
    setValue("dateTime", currentDateTime, { shouldValidate: true, shouldDirty: true });
    
    // Create payload with the most up-to-date values
    const latestValues = getValues();
    const [date, time] = latestValues.dateTime.split(', ');
    
    const billPayload = {
      billNo: Number(latestValues.serialNumber),
      date: date,
      time: time,
      vehicleNo: latestValues.vehicleNumber,
      material: latestValues.materialName,
      party: latestValues.partyName,
      charges: latestValues.charges || 0,
      paidStatus: latestValues.paymentStatus === "Paid",
      firstWeight: latestValues.firstWeight,
      secondWeight: latestValues.secondWeight,
      netWeight: netWeight,
      whatsappNumber: latestValues.whatsappNumber || "",
      customerId: latestValues.customerId || ""
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
      
      handlePrint();

      let toastMessage = {
        title: "Bill Saved",
        description: "The bill has been saved and printed.",
      };

      if (latestValues.whatsappNumber) {
        const message = `
*WeighBridge Bill*
-------------------------
*Serial No:* ${latestValues.serialNumber}
*Date:* ${latestValues.dateTime}
*Vehicle No:* ${latestValues.vehicleNumber.toUpperCase()}
*Party Name:* ${latestValues.partyName}
*Material:* ${latestValues.materialName}
*Charges:* ₹${latestValues.charges || 0}
*Payment:* ${latestValues.paymentStatus}
*First Weight:* ${latestValues.firstWeight}
*Second Weight:* ${latestValues.secondWeight}
*Net Weight:* ${netWeight}
-------------------------
Thank you!
        `.trim();

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/91${latestValues.whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, "_blank");

        toastMessage = {
          title: "Bill Saved & WhatsApp Ready",
          description: "Please press send in the newly opened WhatsApp tab.",
        };
      }
      
      toast(toastMessage);
      handleReset(); 

    } catch (error) {
      console.error("Failed to save or send bill:", error);
      toast({ variant: "destructive", title: "Error", description: `Could not save the bill. ${error.message}` });
    }
  }

  const handleTouchStart = (e) => {
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const touchY = e.targetTouches[0].clientY;
    const pullDistance = touchY - touchStartY.current;

    if (window.scrollY === 0 && pullDistance > PULL_THRESHOLD) {
      setIsRefreshing(true);
    }
  };

  const handleTouchEnd = () => {
    if (isRefreshing) {
      handleReset();
      toast({ title: "Refreshed", description: "New bill ready." });
    }
    setIsRefreshing(false);
    touchStartY.current = 0;
  };
  
  const handleCustomerSelect = (value) => {
      const customerId = value;
      const customer = customers.find((c) => c.customerId === customerId);
      if (customer) {
          setSelectedCustomerForDisplay(customer);
          setValue("customerId", customer.customerId);
          setValue("partyName", customer.companyName);
          setValue("whatsappNumber", customer.whatsappNumber || "");
          if(customer.vehicleNumber) setValue("vehicleNumber", customer.vehicleNumber);
      }
      setIsCustomerPopoverOpen(false);
  };
  
  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      <Card className="w-full max-w-4xl printable-card shadow-2xl">
        <CardHeader className="no-print">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-primary flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Scale /> {config.companyName || translations.weighbridge_form.title}
            </div>
            {isClient && <LiveClock />}
          </CardTitle>
          <CardDescription>
            {translations.weighbridge_form.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="no-print">
                   <BillContent
                    form={form}
                    serialDataRef={serialDataRef}
                    isManualMode={isManualMode}
                    setIsManualMode={setIsManualMode}
                    fetchNewSerialNumber={fetchNewSerialNumber}
                    setInitialDateTime={setInitialDateTime}
                    handleVehicleBlur={handleVehicleBlur}
                    isLoadingVehicle={isLoadingVehicle}
                    previousWeights={previousWeights}
                    handleWeightSelection={handleWeightSelection}
                    chargeExtremes={chargeExtremes}
                    handleChargeSelection={handleChargeSelection}
                    isCustomerPopoverOpen={isCustomerPopoverOpen}
                    setIsCustomerPopoverOpen={setIsCustomerPopoverOpen}
                    selectedCustomerForDisplay={selectedCustomerForDisplay}
                    customers={customers}
                    handleCustomerSelect={handleCustomerSelect}
                    netWeight={netWeight}
                    charges={charges}
                    qrCodeUrl={qrCodeUrl}
                    setIsShareLocationOpen={setIsShareLocationOpen}
                    translations={translations}
                   />
                </div>
                <div className="print-only" id="print-section">
                   {/* This is a placeholder for the print content that will be generated on the fly */}
                </div>
                <CardFooter className="flex flex-col sm:flex-row sm:flex-wrap justify-end gap-2 sm:gap-4 no-print mt-4">
                    <Link href="/reports" passHref>
                        <Button variant="outline" className="w-full sm:w-auto">
                        <BarChart2 className="mr-2 h-4 w-4" />
                        {translations.weighbridge_form.view_reports}
                        </Button>
                    </Link>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button type="button" variant="outline" className="w-full sm:w-auto">
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            {translations.weighbridge_form.reprint_bill}
                        </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{translations.weighbridge_form.reprint_bill}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {translations.weighbridge_form.reprint_bill_description}
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
                            <AlertDialogCancel>{translations.weighbridge_form.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => {
                                findBill();
                            }} disabled={isLoadingReprint}>
                            {isLoadingReprint && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {translations.weighbridge_form.find_bill}
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
                        {translations.weighbridge_form.send_print}
                    </Button>
                </CardFooter>
            </form>
            </Form>
        </CardContent>
      </Card>
      <ReprintDialog 
        isOpen={isReprintDialogOpen} 
        onOpenChange={setIsReprintDialogOpen} 
        reprintData={reprintData} 
        toast={toast} 
        config={config} 
        translations={translations} 
      />
      {selectedCustomerForDisplay && 
        <ShareLocationDialog 
          isOpen={isShareLocationOpen}
          onOpenChange={setIsShareLocationOpen}
          customer={selectedCustomerForDisplay}
          toast={toast}
          translations={translations}
        />
      }
      <style id="global-styles-for-print" dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
                size: 10in 7in;
                margin: 0.25in;
            }
            body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .printable-section { display: flex; flex-direction: row; justify-content: space-between; gap: 0.5rem; width: 100%; }
            .printable-content-wrapper { flex: 1 1 32%; min-width: 0; padding: 0.5rem; font-size: 9px; }
          }
      `}} />
    </div>
  );
}

    