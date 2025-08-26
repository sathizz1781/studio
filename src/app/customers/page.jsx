"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from "next/dynamic";
import axios from "axios";

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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  User,
  Users,
  MapPin,
  PlusCircle,
  Pencil,
  Mail,
  Phone,
  Building,
  FileText,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Dynamically import Leaflet and React-Leaflet components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const useMap = dynamic(
  () => import("react-leaflet").then((mod) => mod.useMap),
  { ssr: false }
);

const customerSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  gstNo: z.string().min(1, "GST number is required"),
  whatsappNumber: z.string().regex(/^\d{10,15}$/, "Enter a valid number"),
  email: z.string().email("Enter a valid email address"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// A wrapper component for the marker
const DraggableMarker = ({ position, setPosition, onPositionChange }) => {
  const map = useMap();
  const markerRef = React.useRef(null);
  const [L, setL] = useState(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet);
      delete leaflet.Icon.Default.prototype._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
    });
  }, []);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          const newPos = { lat, lng };
          setPosition(newPos);
          onPositionChange(newPos);
          map.setView(newPos);
        }
      },
    }),
    [map, setPosition, onPositionChange]
  );

  useEffect(() => {
    if (position?.lat && position?.lng) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  if (!position?.lat || !position?.lng || !L) return null;

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    >
      <Popup>Drag to select the exact location</Popup>
    </Marker>
  );
};

// A wrapper for the search control
const SearchControl = ({ setPosition, onPositionChange, toast }) => {
  const map = useMap();

  useEffect(() => {
    let isMounted = true;
    Promise.all([import("leaflet"), import("leaflet-control-geocoder")]).then(
      ([L, Geocoder]) => {
        if (!isMounted) return;

        // CSS imports are tricky with dynamic imports, better to have them globally
        // or ensure they are loaded before this component renders.
        // Assuming they are loaded in the main layout for simplicity.

        const geocoder = L.Control.Geocoder.nominatim();
        const control = L.Control.geocoder({
          geocoder: geocoder,
          defaultMarkGeocode: false,
          position: "topright",
          placeholder: "Search for a location...",
        })
          .on("markgeocode", function (e) {
            const { center, name } = e.geocode;
            map.setView(center, 15);
            setPosition(center);
            onPositionChange(center);
            toast({
              title: "Location Found",
              description: name,
            });
          })
          .addTo(map);

        return () => {
          if (map && control) {
            map.removeControl(control);
          }
        };
      }
    );

    return () => {
      isMounted = false;
    };
  }, [map, setPosition, onPositionChange, toast]);

  return null;
};

const CustomerPage = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerList, setCustomerList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { toast } = useToast();

  const addForm = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      companyName: "",
      contactPerson: "",
      gstNo: "",
      whatsappNumber: "",
      email: "",
      latitude: 11.341,
      longitude: 77.7172,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(customerSchema),
  });

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        "https://bend-mqjz.onrender.com/api/user/userlist"
      );
      setCustomerList(response.data.users || []);
    } catch (error) {
      console.error("Error fetching user list:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load customers.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomer = async (values) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        "https://bend-mqjz.onrender.com/api/user/createuser",
        values
      );
      if (response.data.user) {
        toast({
          title: "Customer Added",
          description: `${values.companyName} was successfully added!`,
        });
        fetchCustomers();
        addForm.reset();
        setActiveTab("list");
      } else {
        throw new Error("No user data returned from API");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while adding the customer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (values) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `https://bend-mqjz.onrender.com/api/user/updateuser/${selectedCustomer.customerId}`,
        values
      );
      if (response.data.user) {
        toast({
          title: "Customer Updated",
          description: `${values.companyName} was successfully updated!`,
        });
        fetchCustomers();
        setEditMode(false);
        setIsSheetOpen(false);
        setSelectedCustomer(null);
      } else {
        throw new Error("No user data returned from API");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while updating the customer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    editForm.reset({
      companyName: customer.companyName,
      contactPerson: customer.contactPerson,
      gstNo: customer.gstNo,
      whatsappNumber: customer.whatsappNumber,
      email: customer.email,
      latitude: customer.latitude || 11.341,
      longitude: customer.longitude || 77.7172,
    });
    setEditMode(false);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedCustomer(null);
    setEditMode(false);
  };
  
  const MapPicker = ({ form, initialPosition }) => {
    const [position, setPosition] = useState(initialPosition);

    const onPositionChange = (newPos) => {
      form.setValue("latitude", newPos.lat, { shouldValidate: true });
      form.setValue("longitude", newPos.lng, { shouldValidate: true });
    };

    if (!isClient) {
      return (
        <div className="h-[400px] w-full bg-muted rounded-md flex items-center justify-center">
          Loading map...
        </div>
      );
    }

    return (
      <div className="h-[400px] w-full rounded-md overflow-hidden border">
        <MapContainer
          key={`${position.lat}-${position.lng}-${editMode ? "edit" : "add"}`}
          center={position}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(map) => {
            setTimeout(() => map.invalidateSize(), 200); // Ensures map resizes correctly in sheet/tab
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <DraggableMarker
            position={position}
            setPosition={setPosition}
            onPositionChange={onPositionChange}
          />
          <SearchControl
            setPosition={setPosition}
            onPositionChange={onPositionChange}
            toast={toast}
          />
        </MapContainer>
      </div>
    );
  };

  const AddCustomerForm = ({ form, onSubmit }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter company name" {...field} />
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
                  <Input placeholder="Enter contact person" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gstNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GST Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter GST number" {...field} />
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
                  <Input placeholder="Enter WhatsApp number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Separator />
        <h3 className="text-lg font-medium">Location</h3>
        <MapPicker
          form={form}
          initialPosition={{
            lat: form.getValues("latitude"),
            lng: form.getValues("longitude"),
          }}
        />
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input type="number" {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input type="number" {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Customer
        </Button>
      </form>
    </Form>
  );

  return (
    <div className="container mx-auto py-4">
      <h1 className="text-3xl font-bold mb-6">Customer Management</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">
            <Users className="mr-2 h-4 w-4" />
            Customer List
          </TabsTrigger>
          <TabsTrigger value="add">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Customer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Existing Customers</CardTitle>
              <CardDescription>
                View and manage your customers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {customerList.map((customer) => (
                      <Card
                        key={customer.customerId}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => showCustomerDetails(customer)}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                             <Building className="h-5 w-5 text-primary" />
                             {customer.companyName}
                          </CardTitle>
                          <CardDescription>
                            {customer.contactPerson}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                           <p className="flex items-center gap-2"><FileText className="h-4 w-4" /> {customer.gstNo}</p>
                           <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {customer.whatsappNumber}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add a New Customer</CardTitle>
              <CardDescription>
                Fill out the form to add a new customer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddCustomerForm form={addForm} onSubmit={handleAddCustomer} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent className="w-full max-w-none md:max-w-2xl overflow-y-auto">
          {selectedCustomer && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {editMode ? "Edit Customer" : "Customer Details"}
                </SheetTitle>
                <SheetDescription>
                  {editMode
                    ? "Update the customer's information below."
                    : "View the customer's information."}
                </SheetDescription>
              </SheetHeader>

              <div className="py-6">
                {editMode ? (
                  <Form {...editForm}>
                    <form
                      onSubmit={editForm.handleSubmit(handleUpdateCustomer)}
                      className="space-y-6"
                    >
                       <div className="grid md:grid-cols-2 gap-4">
                          <FormField control={editForm.control} name="companyName" render={({ field }) => ( <FormItem> <FormLabel>Company Name</FormLabel> <FormControl> <Input {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                          <FormField control={editForm.control} name="contactPerson" render={({ field }) => ( <FormItem> <FormLabel>Contact Person</FormLabel> <FormControl> <Input {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                          <FormField control={editForm.control} name="gstNo" render={({ field }) => ( <FormItem> <FormLabel>GST Number</FormLabel> <FormControl> <Input {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                          <FormField control={editForm.control} name="whatsappNumber" render={({ field }) => ( <FormItem> <FormLabel>WhatsApp Number</FormLabel> <FormControl> <Input {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                          <FormField control={editForm.control} name="email" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel>Email</FormLabel> <FormControl> <Input {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                        </div>
                       <Separator />
                       <h3 className="text-lg font-medium">Location</h3>
                       <MapPicker form={editForm} initialPosition={{ lat: editForm.getValues("latitude"), lng: editForm.getValues("longitude") }} />
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField control={editForm.control} name="latitude" render={({ field }) => ( <FormItem> <FormLabel>Latitude</FormLabel> <FormControl> <Input type="number" {...field} disabled /> </FormControl> <FormMessage /> </FormItem> )}/>
                            <FormField control={editForm.control} name="longitude" render={({ field }) => ( <FormItem> <FormLabel>Longitude</FormLabel> <FormControl> <Input type="number" {...field} disabled /> </FormControl> <FormMessage /> </FormItem> )}/>
                        </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm"><strong>Company:</strong> {selectedCustomer.companyName}</div>
                    <div className="text-sm"><strong>Contact:</strong> {selectedCustomer.contactPerson}</div>
                    <div className="text-sm"><strong>GST No:</strong> {selectedCustomer.gstNo}</div>
                    <div className="text-sm"><strong>Email:</strong> {selectedCustomer.email}</div>
                    <div className="text-sm"><strong>WhatsApp:</strong> {selectedCustomer.whatsappNumber}</div>
                    <Separator />
                    <h3 className="text-lg font-medium">Location</h3>
                    <div className="h-[300px] w-full rounded-md overflow-hidden border">
                         <iframe
                           width="100%"
                           height="100%"
                           style={{ border: 0 }}
                           loading="lazy"
                           allowFullScreen
                           src={`https://maps.google.com/maps?q=${selectedCustomer.latitude},${selectedCustomer.longitude}&hl=es&z=14&output=embed`}
                         ></iframe>
                    </div>
                  </div>
                )}
              </div>

              <SheetFooter>
                {editMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={editForm.handleSubmit(handleUpdateCustomer)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setEditMode(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Customer
                  </Button>
                )}
                <SheetClose asChild>
                  <Button variant="secondary">Close</Button>
                </SheetClose>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CustomerPage;
