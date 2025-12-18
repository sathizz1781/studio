

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "@/app/layout";

function SerialDataComponent({ serialDataRef }) {
  // store value + sequence to force rerender even when value repeats
  const [serialData, setSerialData] = useState({ value: "000000", seq: 0 });
  const { config } = useAppContext();
  const socketRef = useRef(null);

  // Use a ref to always access the latest setter without closure issues
  const setSerialDataRef = useRef(setSerialData);
  useEffect(() => {
    setSerialDataRef.current = setSerialData;
  }, []);

  // Handle socket data events with proper state access
  const handleSocketData = useCallback((data) => {
    console.log(data, "RECEIVED DATA");

    let output = data.split("N+").pop().split(".").shift();
    console.log(output, "PARSED OUTPUT");
    const sanitizedOutput = output.replace(/\s/g, "");
    console.log(sanitizedOutput, "SANITIZE");

    if (sanitizedOutput.length === 6 && /^\d+$/.test(sanitizedOutput)) {
      console.log(sanitizedOutput, "output set - calling setSerialData");
      // update state with a seq to ensure rerender even if value is identical
      setSerialDataRef.current((prev) => ({ value: sanitizedOutput, seq: (prev?.seq || 0) + 1 }));

      // Update ref immediately for external access without state delay
      if (serialDataRef?.current) {
        console.log(sanitizedOutput, "PASTING to ref");
        serialDataRef.current.weight = Number(sanitizedOutput);
      }
    }
  }, [serialDataRef]);

  useEffect(() => {
    // Fallback to localhost if no host is configured
    const host = config.serialHost ? `https://${config.serialHost}` : "https://localhost:4000";

    async function connectSocket() {
      const { io } = await import("socket.io-client"); // ⚡ dynamic import (client only)
  
      socketRef.current = io(host, {
        transports: ["websocket"],
        secure: true,
        rejectUnauthorized: false, // because it's self-signed
      });
  
      socketRef.current.on("data", handleSocketData);
  
      socketRef.current.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message} on host ${host}`);
      });

      socketRef.current.on('connect', () => {
        console.log(`Connected to serial data host: ${host}`);
      });
    }
  
    connectSocket();
  
    return () => {
      if (socketRef.current) {
        socketRef.current.off("data", handleSocketData);
        socketRef.current.disconnect();
      }
    };
  }, [config.serialHost, handleSocketData]);
// Log whenever serialData (value or seq) changes — helps verify renders
useEffect(() => {
  console.log(serialData, "SERIAL DATA ABOUT TO RENDER");
}, [serialData]);
  return (
    <p
       className="w-full text-center font-mono font-bold tracking-[10px] md:tracking-[15px] text-4xl sm:text-5xl md:text-6xl lg:text-8xl p-2 rounded-lg border-4 md:border-8 border-primary bg-background text-foreground"
    >
      {serialData.value}
    </p>
  );
}

export default SerialDataComponent;
// Also provide a named export for existing imports
export { SerialDataComponent };
    


