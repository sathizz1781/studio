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
       className="w-full text-center font-mono font-bold tracking-[10px] md:tracking-[15px] text-4xl sm:text-5xl md:text-6xl lg:text-8xl p-2 rounded-lg border-4 md:border-8 border-primary bg-background text-foreground"
    >
      {serialData}
    </p>
  );
};
