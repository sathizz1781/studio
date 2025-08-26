
"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-control-geocoder';

// Fix for default icon paths in Next.js
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


const DraggableMarker = ({ position, onPositionChange }) => {
    const markerRef = useRef(null);
    const map = useMap();

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const { lat, lng } = marker.getLatLng();
                    onPositionChange({ lat, lng });
                }
            },
        }),
        [onPositionChange],
    );

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
            ref={markerRef}>
            <Popup>Drag to select the exact location</Popup>
        </Marker>
    );
}

const AddSearchControl = ({ onPositionChange }) => {
    const map = useMap();

    useEffect(() => {
        const geocoder = L.Control.Geocoder.nominatim();
        const searchControl = new L.Control.Geocoder({
            geocoder,
            position: 'topright',
            placeholder: 'Search for a location...',
            defaultMarkGeocode: false // We handle the marker ourselves
        });

        searchControl.on('markgeocode', (e) => {
            const { center } = e.geocode;
            if (center) {
                map.setView(center, 15);
                onPositionChange(center);
            }
        });

        map.addControl(searchControl);

        return () => {
            map.removeControl(searchControl);
        };
    }, [map, onPositionChange]);

    return null;
}


const MapPicker = ({ latitude, longitude, onLocationSelect }) => {
    const initialPosition = [latitude || 11.3410, longitude || 77.7172];
    const [position, setPosition] = useState(initialPosition);

    useEffect(() => {
        setPosition([latitude, longitude]);
    }, [latitude, longitude]);

    const handlePositionChange = (newPos) => {
        setPosition([newPos.lat, newPos.lng]);
        onLocationSelect(newPos);
    };

    return (
        <div className="h-full w-full rounded-md overflow-hidden border">
            <MapContainer 
                center={position} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                // This key forces re-initialization when the component is reused
                key={`${latitude}-${longitude}`} 
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <DraggableMarker 
                    position={position} 
                    onPositionChange={handlePositionChange} 
                />
                <AddSearchControl onPositionChange={handlePositionChange} />
            </MapContainer>
        </div>
    );
};

export default MapPicker;
