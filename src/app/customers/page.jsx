
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Tabs,
  Drawer,
  List,
  Form,
  Input,
  Button,
  Row,
  Col,
  notification,
  Spin,
  Empty,
  Typography,
} from "antd";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import "leaflet-control-geocoder";

// Fix for default icon issues with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const { Title, Text } = Typography;

const DraggableMarker = ({ position, setPosition, setLatitude, setLongitude }) => {
    const map = useMap();
    const markerRef = React.useRef(null);
  
    const eventHandlers = useMemo(() => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          setPosition({ lat, lng });
          setLatitude(lat);
          setLongitude(lng);
          map.setView({ lat, lng });
        }
      },
    }), [map, setPosition, setLatitude, setLongitude]);
  
    useEffect(() => {
        if(position) {
            map.setView(position, map.getZoom());
        }
    }, [position, map]);

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

const SearchControl = ({ setPosition, setLatitude, setLongitude }) => {
    const map = useMap();
  
    useEffect(() => {
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
        setLatitude(center.lat);
        setLongitude(center.lng);
        notification.success({
            message: "Location Found",
            description: name,
        });
      })
      .addTo(map);
  
      return () => {
        map.removeControl(control);
      };
    }, [map, setPosition, setLatitude, setLongitude]);
  
    return null;
};


const CustomerPage = () => {
  const [activeKey, setActiveKey] = useState("1");
  const [visible, setVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerList, setCustomerList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for map positions
  const [addPosition, setAddPosition] = useState({ lat: 11.3410, lng: 77.7172 });
  const [editPosition, setEditPosition] = useState({ lat: 11.3410, lng: 77.7172 });
  
  // State for lat/lng values
  const [addLatitude, setAddLatitude] = useState(11.3410);
  const [addLongitude, setAddLongitude] = useState(77.7172);
  const [editLatitude, setEditLatitude] = useState(11.3410);
  const [editLongitude, setEditLongitude] = useState(77.7172);

  const [editMode, setEditMode] = useState(false);
  const [drawerForm] = Form.useForm();
  const [addForm] = Form.useForm();
  
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        "https://bend-mqjz.onrender.com/api/user/userlist"
      );
      setCustomerList(response.data.users || []);
    } catch (error) {
      console.error("Error fetching user list:", error);
      notification.error({
        message: "Error",
        description: "Could not load customers. Please try again later.",
      });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const showCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    const lat = customer.latitude || 11.3410;
    const lng = customer.longitude || 77.7172;
    setEditPosition({ lat, lng });
    setEditLatitude(lat);
    setEditLongitude(lng);
    setEditMode(false);
    
    drawerForm.setFieldsValue({
      companyName: customer.companyName,
      contactPerson: customer.contactPerson,
      gstNo: customer.gstNo,
      whatsappNumber: customer.whatsappNumber,
      email: customer.email,
    });
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
    setSelectedCustomer(null);
  };

  const handleDrawerSave = async (values) => {
    setIsSubmitting(true);
    const updatedCustomer = {
      ...values,
      latitude: editLatitude,
      longitude: editLongitude,
    };

    try {
      const response = await axios.post(
        `https://bend-mqjz.onrender.com/api/user/updateuser/${selectedCustomer.customerId}`,
        updatedCustomer
      );
      if (response.data.user) {
        notification.success({
          message: "Customer Updated",
          description: `Customer ${updatedCustomer.companyName} was successfully updated!`,
        });
        fetchCustomers(); // Refetch list
        setEditMode(false);
        setVisible(false);
      } else {
        throw new Error("No user data returned from API");
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "An error occurred while updating the customer.",
      });
      console.error("Error updating customer:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddCustomer = async (values) => {
    if (!addLatitude || !addLongitude) {
      notification.error({
        message: "Location Required",
        description: "Please select a location on the map.",
      });
      return;
    }

    setIsSubmitting(true);
    const customerData = {
      ...values,
      latitude: addLatitude,
      longitude: addLongitude,
    };

    try {
      const response = await axios.post(
        "https://bend-mqjz.onrender.com/api/user/createuser",
        customerData
      );
      if (response.data.user) {
        notification.success({
          message: "Customer Added",
          description: `Customer ${customerData.companyName} was successfully added!`,
        });
        fetchCustomers();
        addForm.resetFields();
        setAddPosition({ lat: 11.3410, lng: 77.7172 }); // Reset map
        setActiveKey("1");
      } else {
        throw new Error("No user data returned from API");
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "An error occurred while adding the customer.",
      });
      console.error("Error adding customer:", error);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const tabItems = [
    {
      key: '1',
      label: 'Customer List',
      children: isLoading ? (
          <div className="flex justify-center items-center h-64">
              <Spin size="large" />
          </div>
      ) : (
          <List
              bordered
              dataSource={customerList}
              renderItem={(customer) => (
                  <List.Item
                      key={customer.customerId}
                      onClick={() => showCustomerDetails(customer)}
                      className="cursor-pointer hover:bg-gray-50"
                  >
                      <List.Item.Meta
                          title={<Text strong>{`${customer.companyName} - ${customer.customerId}`}</Text>}
                          description={customer.contactPerson}
                      />
                  </List.Item>
              )}
              locale={{ emptyText: <Empty description="No customers found. Add one in the next tab!" /> }}
          />
      ),
    },
    {
      key: '2',
      label: 'Add New Customer',
      children: (
        <Form form={addForm} layout="vertical" onFinish={handleAddCustomer} disabled={isSubmitting}>
          <Row gutter={16}>
              <Col xs={24} md={12}>
                  <Form.Item label="Company Name" name="companyName" rules={[{ required: true }]}>
                      <Input placeholder="Enter company name" />
                  </Form.Item>
              </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Contact Person" name="contactPerson" rules={[{ required: true }]}>
                      <Input placeholder="Enter contact person's name" />
                  </Form.Item>
              </Col>
          </Row>
          <Row gutter={16}>
              <Col xs={24} md={12}>
                  <Form.Item label="GST No" name="gstNo" rules={[{ required: true }]}>
                      <Input placeholder="Enter GST number" />
                  </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                  <Form.Item label="WhatsApp No" name="whatsappNumber" rules={[{ required: true, pattern: /^\d{10,15}$/, message: "Enter a valid number" }]}>
                      <Input placeholder="Enter WhatsApp number" />
                  </Form.Item>
              </Col>
          </Row>
          <Row gutter={16}>
              <Col xs={24} md={12}>
                  <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
                      <Input placeholder="Enter Email Id" />
                  </Form.Item>
              </Col>
          </Row>
          
          <Title level={5}>Location</Title>
          <div style={{ height: "400px", width: "100%", marginBottom: '1rem', border: '1px solid #d9d9d9', borderRadius: '2px' }}>
              <MapContainer
                  center={addPosition}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
              >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <DraggableMarker position={addPosition} setPosition={setAddPosition} setLatitude={setAddLatitude} setLongitude={setAddLongitude}/>
                  <SearchControl setPosition={setAddPosition} setLatitude={setAddLatitude} setLongitude={setAddLongitude} />
              </MapContainer>
          </div>
          
          <Row gutter={16} className="mb-4">
              <Col><Text strong>Latitude:</Text> {addLatitude}</Col>
              <Col><Text strong>Longitude:</Text> {addLongitude}</Col>
          </Row>

          <Form.Item>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                  Add Customer
              </Button>
          </Form.Item>
        </Form>
      )
    }
  ];

  return (
    <div className="container mx-auto py-4">
        <Title level={2} className="mb-6">Customer Management</Title>
        <Tabs
            defaultActiveKey="1"
            activeKey={activeKey}
            onChange={(key) => setActiveKey(key)}
            type="card"
            items={tabItems}
        />
        
        <Drawer
            title={<Title level={4}>Customer Details: {selectedCustomer?.companyName}</Title>}
            placement="right"
            width={ typeof window !== 'undefined' && window.innerWidth > 768 ? "50%" : "90%" }
            onClose={onClose}
            open={visible}
            destroyOnClose
        >
            {selectedCustomer && (
            <>
                <p><Text strong>Customer ID:</Text> {selectedCustomer.customerId}</p>
                {editMode ? (
                <Form form={drawerForm} layout="vertical" onFinish={handleDrawerSave} initialValues={selectedCustomer} disabled={isSubmitting}>
                    <Form.Item label="Company Name" name="companyName" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                     <Form.Item label="Contact Person" name="contactPerson" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="GST No" name="gstNo" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="WhatsApp Number" name="whatsappNumber" rules={[{ required: true, pattern: /^\d{10,15}$/, message: "Enter a valid number" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
                        <Input />
                    </Form.Item>
                    
                    <Title level={5}>Location</Title>
                     <div style={{ height: "300px", width: "100%", marginBottom: 16, border: '1px solid #d9d9d9', borderRadius: '2px' }}>
                        <MapContainer center={editPosition} zoom={13} style={{ height: "100%", width: "100%" }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <DraggableMarker position={editPosition} setPosition={setEditPosition} setLatitude={setEditLatitude} setLongitude={setEditLongitude}/>
                            <SearchControl setPosition={setEditPosition} setLatitude={setEditLatitude} setLongitude={setEditLongitude} />
                        </MapContainer>
                    </div>
                     <Row gutter={16} className="mb-4">
                        <Col><Text strong>Latitude:</Text> {editLatitude}</Col>
                        <Col><Text strong>Longitude:</Text> {editLongitude}</Col>
                    </Row>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={isSubmitting}>Save</Button>
                        <Button style={{ marginLeft: 8 }} onClick={() => setEditMode(false)}>Cancel</Button>
                    </Form.Item>
                </Form>
                ) : (
                <>
                    <p><Text strong>Company:</Text> {selectedCustomer.companyName}</p>
                    <p><Text strong>Contact Person:</Text> {selectedCustomer.contactPerson}</p>
                    <p><Text strong>GST No:</Text> {selectedCustomer.gstNo}</p>
                    <p><Text strong>WhatsApp No:</Text> {selectedCustomer.whatsappNumber}</p>
                    <p><Text strong>Email:</Text> {selectedCustomer.email}</p>
                    
                    <Title level={5} className="mt-4">Location</Title>
                    <div style={{ width: "100%", height: "300px", marginBottom: 16, border: '1px solid #d9d9d9', borderRadius: '2px', overflow: 'hidden' }}>
                        <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            src={`https://maps.google.com/maps?q=${selectedCustomer.latitude},${selectedCustomer.longitude}&hl=es&z=14&output=embed`}>
                        </iframe>
                    </div>

                    <Button type="primary" onClick={() => setEditMode(true)}>Edit</Button>
                </>
                )}
            </>
            )}
        </Drawer>
    </div>
    );
};

export default CustomerPage;
