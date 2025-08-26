
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

// Fix for default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DraggableMarker = ({ position, setPosition, onLocationSelect }) => {
    const markerRef = useRef(null);
    const map = useMap();
  
    useEffect(() => {
        map.setView(position, map.getZoom());
    }, [position, map]);

    const eventHandlers = React.useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            const { lat, lng } = marker.getLatLng();
            setPosition([lat, lng]);
            onLocationSelect(lat, lng);
          }
        },
      }),
      [onLocationSelect, setPosition],
    );
  
    return (
      <Marker
        draggable={true}
        eventHandlers={eventHandlers}
        position={position}
        ref={markerRef}>
        <Popup>Drag to select the exact location.</Popup>
      </Marker>
    );
};

export const MapPicker = ({ onLocationSelect, initialPosition }) => {
  const [position, setPosition] = useState(initialPosition || [11.3410, 77.7172]); // Default to Erode, Tamil Nadu
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm) return;

    const geocoder = L.Control.Geocoder.nominatim();
    geocoder.geocode(searchTerm, (results) => {
      if (results && results.length > 0) {
        const { lat, lng } = results[0].center;
        const newPos = [lat, lng];
        setPosition(newPos);
        onLocationSelect(lat, lng);
      } else {
        alert('Location not found. Please try a different search term.');
      }
    });
  };

  return (
    <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
             <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for a location..."
                className="flex-grow"
            />
            <Button type="submit" size="icon">
                <Search className="h-4 w-4" />
            </Button>
        </form>

        <div className="h-80 w-full rounded-md border overflow-hidden">
            <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <DraggableMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
            </MapContainer>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
             <p>Latitude: <span className="font-mono text-foreground">{position[0].toFixed(6)}</span></p>
             <p>Longitude: <span className="font-mono text-foreground">{position[1].toFixed(6)}</span></p>
        </div>
    </div>
  );
};
