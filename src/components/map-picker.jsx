
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';
import { useToast } from "@/hooks/use-toast";

// Fix for default icon issues with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DraggableMarker = ({ center, onLocationChange }) => {
  const [position, setPosition] = useState(center);
  const map = useMap();

  useEffect(() => {
    setPosition(center);
  }, [center]);

  const markerRef = React.useRef(null);

  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const { lat, lng } = marker.getLatLng();
        setPosition({ lat, lng });
        onLocationChange({ lat, lng });
        map.setView({ lat, lng });
      }
    },
  }), [map, onLocationChange]);

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

const SearchControl = ({ onLocationChange }) => {
  const map = useMap();
  const { toast } = useToast();

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
      onLocationChange(center);
       toast({
          title: "Location Found",
          description: name,
        });
    })
    .addTo(map);

    return () => {
      map.removeControl(control);
    };
  }, [map, onLocationChange, toast]);

  return null;
};

const MapPicker = ({ center, onLocationChange }) => {
  const [currentCenter, setCurrentCenter] = useState(center);

  useEffect(() => {
    setCurrentCenter(center);
  }, [center]);
  
  const handleLocationUpdate = (latLng) => {
    setCurrentCenter(latLng);
    onLocationChange(latLng);
  }

  return (
    <MapContainer center={currentCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <DraggableMarker center={currentCenter} onLocationChange={handleLocationUpdate} />
      <SearchControl onLocationChange={handleLocationUpdate} />
    </MapContainer>
  );
};

export default MapPicker;
