
"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from 'next/dynamic';
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
import { Loader2, User, Users, MapPin, Search as SearchIcon, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Dynamically import Leaflet and React-Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const useMap = dynamic(() => import('react-leaflet').then(mod => mod.useMap), { ssr: false });

const customerSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  gstNo: z.string().min(1, "GST number is required"),
  whatsappNumber: z.string().regex(/^\d{10,15}$/, "Enter a valid number"),
  email: z.string().email("Enter a valid email address"),
  latitude: z.number(),
  longitude: z.number(),
});

// A wrapper component for the marker to handle Leaflet icon issue
const DraggableMarker = ({ position, setPosition, onPositionChange }) => {
    const map = useMap();
    const markerRef = React.useRef(null);
    const [L, setL] = useState(null);

    useEffect(() => {
        import('leaflet').then(leaflet => {
            setL(leaflet);
            delete leaflet.Icon.Default.prototype._getIconUrl;
            leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            });
        });
    }, []);

    const eventHandlers = useMemo(() => ({
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
    }), [map, setPosition, onPositionChange]);
  
    useEffect(() => {
        if(position?.lat && position?.lng) {
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
        Promise.all([
            import('leaflet'),
            import('leaflet-control-geocoder')
        ]).then(([L, Geocoder]) => {
            if (!isMounted) return;

            // Import CSS files here
            import('leaflet/dist/leaflet.css');
            import('leaflet-control-geocoder/dist/Control.Geocoder.css');

            const geocoder = L.Control.Geocoder.nominatim();
            const control = L.Control.geocoder({
                geocoder: geocoder,
                defaultMarkGeocode: false,
                position: 'topright',
                placeholder: 'Search for a location...',
            })
            .on('markgeocode', function(e) {
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
        });

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

    // --- FORMS ---
    const addForm = useForm({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            companyName: "", contactPerson: "", gstNo: "", whatsappNumber: "", email: "",
            latitude: 11.341, longitude: 77.7172,
        },
    });

    const editForm = useForm({
        resolver: zodResolver(customerSchema),
    });

    // --- API CALLS ---
    const fetchCustomers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get("https://bend-mqjz.onrender.com/api/user/userlist");
            setCustomerList(response.data.users || []);
        } catch (error) {
            console.error("Error fetching user list:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not load customers." });
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
            const response = await axios.post("https://bend-mqjz.onrender.com/api/user/createuser", values);
            if (response.data.user) {
                toast({ title: "Customer Added", description: `${values.companyName} was successfully added!` });
                fetchCustomers();
                addForm.reset();
                setActiveTab("list");
            } else {
                throw new Error("No user data returned from API");
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "An error occurred while adding the customer." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleUpdateCustomer = async (values) => {
        setIsSubmitting(true);
        try {
            const response = await axios.post(`https://bend-mqjz.onrender.com/api/user/updateuser/${selectedCustomer.customerId}`, values);
            if (response.data.user) {
                toast({ title: "Customer Updated", description: `${values.companyName} was successfully updated!` });
                fetchCustomers();
                setEditMode(false);
                setIsSheetOpen(false);
                setSelectedCustomer(null);
            } else {
                throw new Error("No user data returned from API");
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "An error occurred while updating the customer." });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- UI HANDLERS ---
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
    
    const MapDisplay = ({ lat, lng }) => {
        if (!isClient || !lat || !lng) {
            return (
                <div className="h-[300px] w-full bg-muted rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">Location not available</p>
                </div>
            );
        }
        return (
            <div className="h-[300px] w-full rounded-md overflow-hidden border">
                <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://maps.google.com/maps?q=${lat},${lng}&hl=es&z=14&output=embed`}>
                </iframe>
            </div>
        );
    };

    const MapPicker = ({ form, initialPosition }) => {
        const [position, setPosition] = useState(initialPosition);

        const onPositionChange = (newPos) => {
            form.setValue('latitude', newPos.lat);
            form.setValue('longitude', newPos.lng);
        };
        
        if (!isClient) {
            return <div className="h-[400px] w-full bg-muted rounded-md flex items-center justify-center">Loading map...</div>;
        }

        return(
            <div className="h-[400px] w-full rounded-md overflow-hidden border">
                 <MapContainer
                  center={position}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  whenCreated={map => {
                      setTimeout(() => map.invalidateSize(), 200);
                  }}
              >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <DraggableMarker position={position} setPosition={setPosition} onPositionChange={onPositionChange} />
                  <SearchControl setPosition={setPosition} onPositionChange={onPositionChange} toast={toast} />
              </MapContainer>
            </div>
        );
    };

    return (
        <div className="container mx-auto py-4">
            <h1 className="text-3xl font-bold mb-6">Customer Management</h1>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="list">Customer List</TabsTrigger>
                    <TabsTrigger value="add">Add New Customer</TabsTrigger>
                </TabsList>
                <TabsContent value="list" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Customers</CardTitle>
                            <CardDescription>Select a customer to view or edit their details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center items-center h-48">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : customerList.length > 0 ? (
                                <ScrollArea className="h-96">
                                    <div className="space-y-2">
                                    {customerList.map((customer) => (
                                        <div
                                            key={customer.customerId}
                                            onClick={() => showCustomerDetails(customer)}
                                            className="p-3 border rounded-md cursor-pointer hover:bg-muted transition-colors flex items-center gap-4"
                                        >
                                            <div className="p-2 bg-secondary rounded-full">
                                               <User className="h-5 w-5 text-secondary-foreground" />
                                            </div>
                                            <div>
                                               <p className="font-semibold">{customer.companyName}</p>
                                               <p className="text-sm text-muted-foreground">{customer.contactPerson} - {customer.customerId}</p>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="text-center py-10">
                                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-2 text-sm font-medium text-muted-foreground">No customers found</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">Add one in the next tab!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="add" className="mt-4">
                   <Card>
                        <CardHeader>
                            <CardTitle>Add a New Customer</CardTitle>
                            <CardDescription>Fill out the form below to create a new customer.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...addForm}>
                                <form onSubmit={addForm.handleSubmit(handleAddCustomer)} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField name="companyName" control={addForm.control} render={({ field }) => (
                                            <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField name="contactPerson" control={addForm.control} render={({ field }) => (
                                            <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField name="gstNo" control={addForm.control} render={({ field }) => (
                                            <FormItem><FormLabel>GST No</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField name="whatsappNumber" control={addForm.control} render={({ field }) => (
                                            <FormItem><FormLabel>WhatsApp No</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField name="email" control={addForm.control} render={({ field }) => (
                                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <Separator />
                                     <div>
                                        <h3 className="text-lg font-medium mb-2">Location</h3>
                                        <MapPicker form={addForm} initialPosition={{ lat: addForm.getValues('latitude'), lng: addForm.getValues('longitude') }} />
                                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                                            <span>Lat: {addForm.watch('latitude').toFixed(4)}</span>
                                            <span>Lng: {addForm.watch('longitude').toFixed(4)}</span>
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Add Customer
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        
            <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
                <SheetContent className="sm:max-w-xl w-full">
                    {selectedCustomer && (
                        <>
                            <SheetHeader>
                                <SheetTitle>{editMode ? "Edit Customer" : "Customer Details"}</SheetTitle>
                                <SheetDescription>{editMode ? "Update the customer's information below." : selectedCustomer.companyName}</SheetDescription>
                            </SheetHeader>
                            <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
                            <div className="py-4 space-y-6">
                                {editMode ? (
                                     <Form {...editForm}>
                                        <form onSubmit={editForm.handleSubmit(handleUpdateCustomer)} className="space-y-6">
                                            <FormField name="companyName" control={editForm.control} render={({ field }) => (
                                                <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField name="contactPerson" control={editForm.control} render={({ field }) => (
                                                <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField name="gstNo" control={editForm.control} render={({ field }) => (
                                                <FormItem><FormLabel>GST No</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField name="whatsappNumber" control={editForm.control} render={({ field }) => (
                                                <FormItem><FormLabel>WhatsApp No</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField name="email" control={editForm.control} render={({ field }) => (
                                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            
                                            <Separator />
                                            <div>
                                                <h3 className="text-lg font-medium mb-2">Location</h3>
                                                <MapPicker form={editForm} initialPosition={{ lat: editForm.getValues('latitude'), lng: editForm.getValues('longitude') }} />
                                                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                                                    <span>Lat: {editForm.watch('latitude').toFixed(4)}</span>
                                                    <span>Lng: {editForm.watch('longitude').toFixed(4)}</span>
                                                </div>
                                            </div>
                                            
                                            <SheetFooter className="mt-6">
                                                <SheetClose asChild>
                                                    <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                                                </SheetClose>
                                                <Button type="submit" disabled={isSubmitting}>
                                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Save Changes
                                                </Button>
                                            </SheetFooter>
                                        </form>
                                    </Form>
                                ) : (
                                    <div className="space-y-4 text-sm">
                                        <p><strong>Customer ID:</strong> {selectedCustomer.customerId}</p>
                                        <p><strong>Company:</strong> {selectedCustomer.companyName}</p>
                                        <p><strong>Contact Person:</strong> {selectedCustomer.contactPerson}</p>
                                        <p><strong>GST No:</strong> {selectedCustomer.gstNo}</p>
                                        <p><strong>WhatsApp No:</strong> {selectedCustomer.whatsappNumber}</p>
                                        <p><strong>Email:</strong> {selectedCustomer.email}</p>
                                        <Separator />
                                        <div>
                                            <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                                               <MapPin className="h-5 w-5" /> Location
                                            </h3>
                                            <MapDisplay lat={selectedCustomer.latitude} lng={selectedCustomer.longitude} />
                                        </div>
                                         <SheetFooter className="mt-6">
                                            <SheetClose asChild>
                                                <Button variant="outline">Close</Button>
                                            </SheetClose>
                                            <Button onClick={() => setEditMode(true)}>Edit</Button>
                                        </SheetFooter>
                                    </div>
                                )}
                            </div>
                            </ScrollArea>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default CustomerPage;

    