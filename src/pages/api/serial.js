let clients = [];

export const config = {
  api: {
    bodyParser: true,
  },
};

export default function handler(req, res) {
  // 🔌 SSE connection (Browser)
  if (req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    clients.push(res);
    console.log("✅ SSE client connected");

    req.on("close", () => {
      clients = clients.filter((c) => c !== res);
      console.log("❌ SSE client disconnected");
    });

    return;
  }

  // 📡 Data from Electron / local app
  if (req.method === "POST") {
    const { value, secret } = req.body || {};

    if (secret !== process.env.SERIAL_SECRET) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Broadcast to all SSE clients
    clients.forEach((client) => {
      client.write(`data: ${JSON.stringify(value)}\n\n`);
    });

    return res.status(200).json({ message: "Broadcasted" });
  }

  res.end();
}
