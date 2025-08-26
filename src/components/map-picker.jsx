
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default icon issues with Leaflet and Webpack
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


function DraggableMarker({ initialPosition, onLocationChange }) {
    const [position, setPosition] = useState(initialPosition);
    const markerRef = useRef(null);
    const map = useMap();
  
    useEffect(() => {
        // When the parent component's initialPosition changes (e.g., loading an existing customer),
        // update the marker's position and fly the map to it.
        setPosition(initialPosition);
        map.flyTo(initialPosition, map.getZoom());
    }, [initialPosition, map]);


    const eventHandlers = useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            const { lat, lng } = marker.getLatLng();
            setPosition([lat, lng]);
            onLocationChange(lat, lng);
          }
        },
      }),
      [onLocationChange],
    );
  
    return (
      <Marker
        draggable={true}
        eventHandlers={eventHandlers}
        position={position}
        ref={markerRef}>
        <Popup>Drag this marker to set the location.</Popup>
      </Marker>
    );
}

export default function MapPicker({ latitude, longitude, onLocationChange }) {
    const initialPosition = [latitude, longitude];

    return (
        <div className="h-[400px] w-full rounded-md overflow-hidden border">
            <MapContainer 
                center={initialPosition} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                whenReady={(map) => {
                    // This callback helps prevent re-initialization errors on hot-reloads
                    // You can add logic here that needs to run once the map is ready
                    setTimeout(() => {
                        map.target.invalidateSize()
                    }, 200)
                }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <DraggableMarker 
                    initialPosition={initialPosition} 
                    onLocationChange={onLocationChange} 
                />
            </MapContainer>
        </div>
    );
}
