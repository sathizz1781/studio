import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-control-geocoder';

// Fix for default icon paths not working in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SearchControl = ({ onLocationSelect }) => {
    const map = useMap();

    useEffect(() => {
        const geocoder = L.Control.Geocoder.nominatim();
        const searchControl = new L.Control.Geocoder({
            geocoder,
            position: 'topright',
            placeholder: 'Search for a location...',
            defaultMarkGeocode: false,
        }).on('markgeocode', function(e) {
            const { center } = e.geocode;
            map.setView(center, 13);
            onLocationSelect({ lat: center.lat, lng: center.lng });
        });

        map.addControl(searchControl);

        return () => {
            map.removeControl(searchControl);
        };
    }, [map, onLocationSelect]);

    return null;
};

const MapPicker = ({ latitude, longitude, onLocationSelect }) => {
    const initialPosition = [latitude || 11.3410, longitude || 77.7172];
    const [markerPosition, setMarkerPosition] = useState(initialPosition);
    const markerRef = useRef(null);

    useEffect(() => {
        // This ensures the marker moves when latitude/longitude props change from the form
        setMarkerPosition([latitude || 11.3410, longitude || 77.7172]);
    }, [latitude, longitude]);
    
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const { lat, lng } = marker.getLatLng();
                    onLocationSelect({ lat, lng });
                }
            },
        }),
        [onLocationSelect]
    );

    const handleMapClick = useCallback((e) => {
        const { lat, lng } = e.latlng;
        setMarkerPosition([lat, lng]);
        onLocationSelect({ lat, lng });
    }, [onLocationSelect]);
    
    const MapEvents = () => {
        useMap().on('click', handleMapClick);
        return null;
    }


    return (
        <MapContainer 
            center={initialPosition} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker
                draggable={true}
                eventHandlers={eventHandlers}
                position={markerPosition}
                ref={markerRef}
            >
                <Popup>Drag to select location</Popup>
            </Marker>
            <SearchControl onLocationSelect={onLocationSelect} />
            <MapEvents />
        </MapContainer>
    );
};

export default MapPicker;
