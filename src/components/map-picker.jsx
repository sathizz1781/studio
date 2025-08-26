"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapPicker = ({ latitude, longitude, onLocationSelect, id = "mapid" }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const container = L.DomUtil.get(id);
    if (container != null) {
      container._leaflet_id = null; // 🧹 clear old Leaflet instance
    }

    // init map
    mapRef.current = L.map(id).setView([latitude, longitude], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapRef.current);

    // draggable marker
    markerRef.current = L.marker([latitude, longitude], { draggable: true })
      .addTo(mapRef.current)
      .bindPopup("Drag me to select location")
      .openPopup();

    markerRef.current.on("dragend", () => {
      const { lat, lng } = markerRef.current.getLatLng();
      onLocationSelect({ lat, lng });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove(); // ✅ destroy map on unmount
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, id, onLocationSelect]);

  return <div id={id} style={{ height: "400px", width: "100%" }} />;
};

export default MapPicker;
