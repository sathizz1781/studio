
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import { useToast } from "@/hooks/use-toast";
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";

const DraggableMarker = ({ position, setPosition, onPositionChange }) => {
  const map = useMap();
  const markerRef = React.useRef(null);
  const [L, setL] = useState(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet);
      // This is a common workaround for a bug in Leaflet with bundlers like Webpack
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
          if (onPositionChange) onPositionChange(newPos);
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

const SearchControl = ({ setPosition, onPositionChange }) => {
  const map = useMap();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      import("leaflet"),
      import("leaflet-control-geocoder"),
    ]).then(([L, { geocoder }]) => {
      if (!isMounted) return;

      const geo = geocoder();
      const control = L.Control.geocoder({
        geocoder: geo,
        defaultMarkGeocode: false,
        position: "topright",
        placeholder: "Search for a location...",
      })
        .on("markgeocode", function (e) {
          const { center, name } = e.geocode;
          map.setView(center, 15);
          setPosition(center);
          if (onPositionChange) onPositionChange(center);
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

const MapPicker = ({ form, initialPosition }) => {
  const [position, setPosition] = useState(initialPosition);

  const onPositionChange = (newPos) => {
    form.setValue("latitude", newPos.lat, { shouldValidate: true });
    form.setValue("longitude", newPos.lng, { shouldValidate: true });
  };

  return (
    <div className="h-[400px] w-full rounded-md overflow-hidden border">
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        whenReady={(map) => {
           // A small delay helps ensure the map container has the correct size
           setTimeout(() => map.target.invalidateSize(), 200);
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
        />
      </MapContainer>
    </div>
  );
};

export default MapPicker;

    