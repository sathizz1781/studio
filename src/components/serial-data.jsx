
"use client";

import React, { useState, useEffect, memo } from "react";
import { io } from "socket.io-client";

// Memoize the component to prevent re-renders when parent's state changes
const MemoizedSerialData = memo(function SerialDataComponent({ serialDataRef }) {
  const [serialData, setSerialData] = useState("000000");

  useEffect(() => {
    let socket;
  
    async function connectSocket() {
      const { io } = await import("socket.io-client"); // ⚡ dynamic import (client only)
  
       socket = io("https://localhost:4000", {
        transports: ["websocket"],
        secure: true,
        rejectUnauthorized: false, // because it's self-signed
      });
  
      socket.on("data", (data) => {
        console.log(data, "RECEIVED DATA");
  
        let output = data.split("N+").pop().split(".").shift();
        const sanitizedOutput = output.replace(/\s/g, "");
  
        if (sanitizedOutput.length === 6 && /^\d+$/.test(sanitizedOutput)) {
          setSerialData(sanitizedOutput);
  
          if (serialDataRef?.current) {
            serialDataRef.current.weight = Number(sanitizedOutput);
          }
        }
      });
  
      socket.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message}`);
      });
    }
  
    connectSocket();
  
    return () => {
      if (socket) socket.disconnect();
    };
  }, [serialDataRef]);
   // Dependency array is correct

  return (
    <p
       className="w-full text-center font-mono font-bold tracking-[10px] md:tracking-[15px] text-4xl sm:text-5xl md:text-6xl lg:text-8xl p-2 rounded-lg border-4 md:border-8 border-primary bg-background text-foreground"
    >
      {serialData}
    </p>
  );
});

export const SerialDataComponent = MemoizedSerialData;

    
