

// "use client";

// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { useAppContext } from "@/app/layout";

// function SerialDataComponent({ serialDataRef }) {
//   const [serialData, setSerialData] = useState("000000");
//   const { config } = useAppContext();
//   const socketRef = useRef(null);

//   // Use a ref to always access the latest setter without closure issues
//   const setSerialDataRef = useRef(setSerialData);
//   useEffect(() => {
//     setSerialDataRef.current = setSerialData;
//   }, []);

//   // Handle socket data events with proper state access
//   const handleSocketData = useCallback((data) => {
//     console.log(data, "RECEIVED DATA");

//     let output = data.split("N+").pop().split(".").shift();
//     console.log(output, "PARSED OUTPUT");
//     const sanitizedOutput = output.replace(/\s/g, "");
//     console.log(sanitizedOutput, "SANITIZE");

//     if (sanitizedOutput.length === 6 && /^\d+$/.test(sanitizedOutput)) {
//       console.log(sanitizedOutput, "output set - calling setSerialData");
//       setSerialDataRef.current(sanitizedOutput);
//       console.log(serialDataRef)
//       // Update ref immediately for external access without state delay
//       if (serialDataRef?.current) {
//         console.log(sanitizedOutput, "PASTING to ref");
//         serialDataRef.current.weight = Number(sanitizedOutput);
//       }
//     }
//   }, [serialDataRef]);

//   useEffect(() => {
//     // Fallback to localhost if no host is configured
//     const host = config.serialHost ? `https://${config.serialHost}` : "https://localhost:4000";

//     async function connectSocket() {
//       const { io } = await import("socket.io-client"); // ⚡ dynamic import (client only)
  
//       socketRef.current = io(host, {
//         transports: ["websocket"],
//         secure: true,
//         rejectUnauthorized: false, // because it's self-signed
//       });
  
//       socketRef.current.on("data", handleSocketData);
  
//       socketRef.current.on("connect_error", (err) => {
//         console.log(`connect_error due to ${err.message} on host ${host}`);
//       });

//       socketRef.current.on('connect', () => {
//         console.log(`Connected to serial data host: ${host}`);
//       });
//     }
  
//     connectSocket();
  
//     return () => {
//       if (socketRef.current) {
//         socketRef.current.off("data", handleSocketData);
//         socketRef.current.disconnect();
//       }
//     };
//   }, [config.serialHost, handleSocketData]);
// console.log(serialData,"SERIAL DATA ABOUT TO RENDER");
//   return (
//     <p
//        className="w-full text-center font-mono font-bold tracking-[10px] md:tracking-[15px] text-4xl sm:text-5xl md:text-6xl lg:text-8xl p-2 rounded-lg border-4 md:border-8 border-primary bg-background text-foreground"
//     >
//       {serialData}
//     </p>
//   );
// }

// export default SerialDataComponent;
// // Also provide a named export for existing imports
// export { SerialDataComponent };
    


// "use client";

// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { useAppContext } from "@/app/layout";

// // 🔁 Toggle this flag for testing
// const TEST_MODE = false; // set false in production

// function SerialDataComponent({ serialDataRef }) {
//   const [serialData, setSerialData] = useState("000000");
//   const { config } = useAppContext();
//   const socketRef = useRef(null);

//   /**
//    * Handle incoming socket / simulated data
//    */
//   const handleSocketData = useCallback(
//     (data) => {
//       console.log("📥 RAW DATA:", data);

//       // 🔹 Parse device format
//       const output =
//         data?.split("N+")?.pop()?.split(".")?.shift() || "";

//       const sanitizedOutput = output.replace(/\s/g, "");

//       console.log("🧹 SANITIZED:", sanitizedOutput);

//       // 🔹 Validate 6-digit numeric weight
//       if (data.length === 6 && /^\d+$/.test(data)) {
//         // ✅ Update UI (state drives rendering)
//         setSerialData((prev) =>
//           prev === data ? prev : data
//         );

//         // ✅ Update ref (for instant external access)
//         if (serialDataRef?.current) {
//           serialDataRef.current.weight = Number(data);
//         }
//       }
//     },
//     [serialDataRef]
//   );

//   /**
//    * 🔌 REAL SOCKET CONNECTION (disabled in test mode)
//    */
//   useEffect(() => {
//     if (TEST_MODE) return;
//     console.log(config?.serialHost,"HOST");

//     const host = config?.serialHost
//       ? `https://${config.serialHost}`
//       : "https://localhost:4000";

//     let isMounted = true;

//     async function connectSocket() {
//       const { io } = await import("socket.io-client");
//       if (!isMounted) return;

//       socketRef.current = io(host, {
//         transports: ["websocket"],
//         secure: true,
//         rejectUnauthorized: false,
//       });

//       socketRef.current.on("data", handleSocketData);

//       socketRef.current.on("connect", () => {
//         console.log("✅ Connected to serial host:", host);
//       });

//       socketRef.current.on("connect_error", (err) => {
//         console.error("❌ Socket error:", err.message);
//       });
//     }

//     connectSocket();

//     return () => {
//       isMounted = false;
//       if (socketRef.current) {
//         socketRef.current.off("data", handleSocketData);
//         socketRef.current.disconnect();
//       }
//     };
//   }, [config?.serialHost, handleSocketData]);

//   /**
//    * 🧪 TEST MODE – Fake socket data every 5 seconds
//    */
//   useEffect(() => {
//     if (!TEST_MODE) return;

//     console.log("🧪 TEST MODE ENABLED: Simulating socket data");

//     const interval = setInterval(() => {
//       const fakeWeight = String(
//         Math.floor(100000 + Math.random() * 900000)
//       );

//       // Simulate real weighing machine format
//       const fakeSocketData = fakeWeight;

//       console.log("🧪 FAKE DATA:", fakeSocketData);

//       handleSocketData(fakeSocketData);
//     }, 5000);

//     return () => clearInterval(interval);
//   }, [handleSocketData]);

//   /**
//    * Debug render confirmation
//    */
//   useEffect(() => {
//     console.log("🔁 UI RENDERED WITH:", serialData);
//   }, [serialData]);

//   return (
//     <p
//       className="w-full text-center font-mono font-bold tracking-[10px] md:tracking-[15px]
//       text-4xl sm:text-5xl md:text-6xl lg:text-8xl
//       p-2 rounded-lg border-4 md:border-8 border-primary
//       bg-background text-foreground"
//     >
//       {serialData}
//     </p>
//   );
// }

// export default SerialDataComponent;
// export { SerialDataComponent };


"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/app/layout";

// 🔁 Toggle for testing
const TEST_MODE = false;

function SerialDataComponent({ serialDataRef }) {
  const [serialData, setSerialData] = useState("000000");
  const { config } = useAppContext();

  /**
   * Handle incoming data (REAL + TEST)
   */
  const handleSocketData = useCallback(
    (data) => {
      console.log("📥 RAW DATA:", data);

      const output =
        data?.split("N+")?.pop()?.split(".")?.shift() || "";

      const sanitized = output.replace(/\s/g, "");

      console.log("🧹 SANITIZED:", sanitized);

      if (sanitized.length === 6 && /^\d+$/.test(sanitized)) {
        setSerialData((prev) =>
          prev === sanitized ? prev : sanitized
        );

        if (serialDataRef?.current) {
          serialDataRef.current.weight = Number(sanitized);
        }
      }
    },
    [serialDataRef]
  );

  /**
   * 🔌 REAL-TIME SSE CONNECTION
   */
  useEffect(() => {
    if (TEST_MODE) return;

    const host = config?.serialHost
      ? `https://${config.serialHost}`
      : window.location.origin;

    const es = new EventSource(`${host}/api/serial`);

    es.onmessage = (event) => {
      try {
        handleSocketData(JSON.parse(event.data));
      } catch (err) {
        console.error("❌ SSE parse error", err);
      }
    };

    es.onerror = (err) => {
      console.error("❌ SSE connection error", err);
    };

    console.log("✅ SSE connected:", `${host}/api/serial`);

    return () => {
      es.close();
      console.log("🔌 SSE disconnected");
    };
  }, [config?.serialHost, handleSocketData]);

  /**
   * 🧪 TEST MODE – Fake data
   */
  useEffect(() => {
    if (!TEST_MODE) return;

    console.log("🧪 TEST MODE ENABLED");

    const interval = setInterval(() => {
      const fake = String(
        Math.floor(100000 + Math.random() * 900000)
      );
      handleSocketData(fake);
    }, 3000);

    return () => clearInterval(interval);
  }, [handleSocketData]);

  return (
    <p
      className="w-full text-center font-mono font-bold tracking-[10px] md:tracking-[15px]
      text-4xl sm:text-5xl md:text-6xl lg:text-8xl
      p-2 rounded-lg border-4 md:border-8 border-primary
      bg-background text-foreground"
    >
      {serialData}
    </p>
  );
}

export default SerialDataComponent;
export { SerialDataComponent };
