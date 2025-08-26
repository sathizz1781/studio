"use client";

import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

export const SerialDataComponent = ({ setCurrentWeight }) => {
  const [serialData, setSerialData] = useState("000000");

  useEffect(() => {
    // Connect to WebSocket server (Change URL if needed)
    const socket = io("http://localhost:4000", {
        reconnectionDelayMax: 10000,
    });

    // Listen for 'data' event
    socket.on("data", (data) => {
      let output = data.split("N+").pop().split(".").shift();
      const sanitizedOutput = output.replace(/\s/g, ''); // Remove whitespace
      if (sanitizedOutput.length === 6 && /^\d+$/.test(sanitizedOutput)) {
        setSerialData(sanitizedOutput);
        setCurrentWeight(Number(sanitizedOutput));
      }
    });

    socket.on('connect_error', (err) => {
        console.log(`connect_error due to ${err.message}`);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [setCurrentWeight]);

  return (
    <p
      style={{
        fontSize: "80px",
        border: "8px solid hsl(var(--primary))",
        padding: '10px',
        borderRadius: "10px",
        color: "hsl(var(--foreground))",
        backgroundColor: "hsl(var(--background))",
        margin: "0px",
        letterSpacing: "15px",
        fontWeight: "600",
        textAlign: 'center',
        fontFamily: 'monospace'
      }}
    >
      {serialData}
    </p>
  );
};
