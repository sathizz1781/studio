import { Server } from "socket.io";

export const config = {
  api: {
    bodyParser: true,
  },
};

export default function handler(req, res) {
  // Initialize Socket.IO once
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO...");

    const io = new Server(res.socket.server, {
      path: "/api/serial",
      transports: ["websocket"],
      cors: {
        origin: "*", // or your Vercel domain
      },
    });

    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("Frontend connected:", socket.id);
    });
  }

  // Handle POST data from local machine
  if (req.method === "POST") {
    const { value, secret } = req.body || {};

    if (!value || !secret) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    if (secret !== process.env.SERIAL_SECRET) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Emit to all connected browsers
    res.socket.server.io.emit("serial:data", value);

    return res.status(200).json({ message: "Data broadcasted" });
  }

  res.status(200).end();
}
