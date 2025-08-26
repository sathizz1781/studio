"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "lucide-react";

const formSchema = z.object({
  vehicleNumber: z.string().min(1, "Vehicle number is required."),
  partyName: z.string().min(1, "Party name is required."),
  materialName: z.string().min(1, "Material name is required."),
  charges: z.coerce
    .number({ invalid_type_error: "Please enter a valid number." })
    .positive("Charges must be a positive number."),
  firstWeight: z.coerce
    .number({ invalid_type_error: "Please enter a valid number." })
    .nonnegative("Weight must be a positive number."),
  secondWeight: z.coerce
    .number({ invalid_type_error: "Please enter a valid number." })
    .nonnegative("Weight must be a positive number."),
  whatsappNumber: z.string().regex(/^\d{10,15}$/, {
    message: "Please enter a valid 10 to 15 digit phone number.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" {...props}>
        <path d="M17.472 14.382c-.297-.149-.88-.436-1.017-.486s-.39-.074-.555.074-.35.486-.432.586-.165.111-.297.037s-1.24-.463-2.36-1.455c-.862-.772-1.45-1.725-1.62-2.023s-.17-.45-.074-.586c.074-.111.165-.24.24-.33s.111-.165.165-.278.037-.24-.037-.35-.555-1.32-.732-1.808s-.35-.41-.486-.41h-.45c-.165 0-.41.074-.628.35s-.88.862-.88 2.1c0 1.238.905 2.437 1.037 2.613s1.77 2.71 4.3 3.822c.565.24.99.375 1.32.486.51.165.968.13 1.32-.074.39-.222.88-.905.99-1.238.111-.33.111-.615.074-.732zM12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18.13c-4.49 0-8.13-3.64-8.13-8.13s3.64-8.13 8.13-8.13 8.13 3.64 8.13 8.13-3.64 8.13-8.13 8.13z" />
    </svg>
);


export function WeighbridgeForm() {
  const [serialNumber, setSerialNumber] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [netWeight, setNetWeight] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleNumber: "",
      partyName: "",
      materialName: "",
      charges: 0,
      firstWeight: 0,
      secondWeight: 0,
      whatsappNumber: "",
    },
  });

  const firstWeight = form.watch("firstWeight");
  const secondWeight = form.watch("secondWeight");
  const charges = form.watch("charges");

  useEffect(() => {
    if (isClient) {
        setSerialNumber(`WB-${Date.now().toString().slice(-6)}`);
        const now = new Date();
        setDateTime(now.toLocaleString('en-IN', { hour12: true }));
    }
  }, [isClient]);

  useEffect(() => {
    const fw = firstWeight || 0;
    const sw = secondWeight || 0;
    const newNetWeight = Math.abs(fw - sw);
    setNetWeight(parseFloat(newNetWeight.toFixed(3)));
  }, [firstWeight, secondWeight]);

  useEffect(() => {
    if (charges > 0) {
      const upiID = "sathishkumar1781@oksbi";
      const businessName = "Amman Weighing Home";
      const upiURL = `upi://pay?pa=${upiID}&pn=${encodeURIComponent(businessName)}&am=${charges.toFixed(2)}&cu=INR`;

      const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiURL)}&size=128x128&margin=0`;
      setQrCodeUrl(apiUrl);
    } else {
      setQrCodeUrl("");
    }
  }, [charges]);

  const handlePrint = () => {
    window.print();
  };
  
  const handleReset = () => {
    form.reset();
    setNetWeight(0);
    setQrCodeUrl("");
    if (isClient) {
        setSerialNumber(`WB-${Date.now().toString().slice(-6)}`);
        setDateTime(new Date().toLocaleString('en-IN', { hour12: true }));
    }
  };

  function onSubmit(values: FormValues) {
    const message = `
*WeighBridge Bill*
-------------------------
*Serial No:* ${serialNumber}
*Date:* ${dateTime}
*Vehicle No:* ${values.vehicleNumber}
*Party Name:* ${values.partyName}
*Material:* ${values.materialName}
*Charges:* ${values.charges}
*First Weight:* ${values.firstWeight} kg
*Second Weight:* ${values.secondWeight} kg
*Net Weight:* ${netWeight} kg
-------------------------
Thank you!
    `.trim();

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${values.whatsappNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");

     toast({
      title: "WhatsApp Message Prepared",
      description: "Please press send in the newly opened WhatsApp tab.",
    });
  }
  
  const BillContent = () => (
    <>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Hash className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Serial Number</p>
              <p className="text-lg font-bold text-foreground">{serialNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Date</p>
              <p className="text-sm text-foreground">{dateTime.split(',')[0]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Time</p>
              <p className="text-sm text-foreground">{dateTime.split(',')[1]}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 mb-6">
          <FormField
            control={form.control}
            name="vehicleNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Truck size={16}/>Vehicle Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., MH12AB1234" {...field} />
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
                <FormLabel className="flex items-center gap-2"><User size={16}/>Party Name</FormLabel>
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
                <FormLabel className="flex items-center gap-2"><Package size={16}/>Material Name</FormLabel>
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
                <FormLabel className="flex items-center gap-2"><CircleDollarSign size={16}/>Charges (₹)</FormLabel>
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
                <FormLabel className="flex items-center gap-2"><Weight size={16}/>First Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g., 5000" {...field} />
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
                <FormLabel className="flex items-center gap-2"><Weight size={16}/>Second Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g., 2000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormItem>
            <FormLabel className="flex items-center gap-2"><Scale size={16}/>Net Weight (kg)</FormLabel>
            <FormControl>
              <Input value={netWeight} disabled className="font-bold text-primary"/>
            </FormControl>
          </FormItem>
        </div>

        {qrCodeUrl && (
          <div className="mt-6 flex flex-col items-center">
            <h3 className="text-lg font-medium text-accent mb-2">Scan to Pay</h3>
            <div className="bg-white p-2 rounded-lg border">
                <Image src={qrCodeUrl} alt="QR Code for UPI Payment" width={128} height={128} unoptimized />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Pay ₹{charges} using any UPI app
            </p>
          </div>
        )}
    </>
  );

  const PrintableBill = () => (
    <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            <p className="text-sm"><strong>Serial:</strong> {serialNumber}</p>
        </div>
        <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <p className="text-sm"><strong>Date:</strong> {dateTime}</p>
        </div>
        <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <p className="text-sm"><strong>Vehicle:</strong> {form.getValues("vehicleNumber")}</p>
        </div>
        <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <p className="text-sm"><strong>Party:</strong> {form.getValues("partyName")}</p>
        </div>
        <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <p className="text-sm"><strong>Material:</strong> {form.getValues("materialName")}</p>
        </div>
        <div className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            <p className="text-sm"><strong>Charges:</strong> ₹{form.getValues("charges")}</p>
        </div>
        <Separator className="my-1"/>
         <div className="flex items-center gap-2">
            <Weight className="h-5 w-5" />
            <p className="text-sm"><strong>First Wt:</strong> {form.getValues("firstWeight")} kg</p>
        </div>
        <div className="flex items-center gap-2">
            <Weight className="h-5 w-5" />
            <p className="text-sm"><strong>Second Wt:</strong> {form.getValues("secondWeight")} kg</p>
        </div>
        <Separator className="my-1" />
        <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <p className="text-sm"><strong>Net Wt:</strong> {netWeight} kg</p>
        </div>
        {qrCodeUrl && (
          <div className="mt-2 flex flex-col items-center">
            <Image src={qrCodeUrl} alt="QR Code for UPI Payment" width={96} height={96} unoptimized />
          </div>
        )}
    </div>
  );


  return (
    <Card className="w-full max-w-4xl printable-card shadow-2xl">
      <CardHeader className="no-print">
        <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
          <Scale /> WeighBridge Biller
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
                <div className="printable-content-wrapper"><PrintableBill /></div>
                <div className="printable-content-wrapper"><PrintableBill /></div>
                <div className="printable-content-wrapper"><PrintableBill /></div>
            </div>
            
            <Separator className="my-8 no-print" />

            {/* Non-Printable Section */}
            <div className="no-print">
               <h3 className="text-lg font-medium text-accent mb-2">Send via WhatsApp</h3>
               <p className="text-sm text-muted-foreground mb-4">Enter a WhatsApp number to send the bill details.</p>
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
          <CardFooter className="flex justify-end gap-4 no-print mt-4">
             <Button type="button" variant="outline" onClick={handleReset}>
              Reset Form
            </Button>
            <Button type="button" variant="secondary" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button type="submit" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
              <WhatsAppIcon className="mr-2 h-5 w-5 fill-current" />
              Send on WhatsApp
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
