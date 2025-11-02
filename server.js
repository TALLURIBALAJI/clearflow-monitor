import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Store latest readings
let latestPh = { ph: 0, ts: 0, timestamp: null };
let latestTurbidity = { turbidity: 0, status: "No data", ts: 0, timestamp: null };

// ==================== NEW ENDPOINTS ====================
// pH endpoint
app.post("/api/ph", (req, res) => {
  const { ph, ts } = req.body ?? {};

  if (ph === undefined || ph === null || Number.isNaN(Number(ph))) {
    return res.status(400).json({ message: "Invalid pH value" });
  }

  latestPh = {
    ph: Number.parseFloat(ph).toFixed(2),
    ts,
    timestamp: new Date().toISOString(),
  };

  console.log(`[pH] Received: ${ph}`);
  return res.status(201).json({ message: "pH data received" });
});

app.get("/api/ph", (_req, res) => {
  res.json(latestPh);
});

// Turbidity endpoint
app.post("/api/turbidity", (req, res) => {
  const { turbidity, status, ts } = req.body ?? {};

  if (turbidity === undefined || turbidity === null || Number.isNaN(Number(turbidity))) {
    return res.status(400).json({ message: "Invalid turbidity value" });
  }

  latestTurbidity = {
    turbidity: Number.parseFloat(turbidity).toFixed(1),
    status: status ?? "Unknown",
    ts,
    timestamp: new Date().toISOString(),
  };

  console.log(`[Turbidity] Received: ${turbidity} NTU | Status: ${status ?? "Unknown"}`);
  return res.status(201).json({ message: "Turbidity data received" });
});

app.get("/api/turbidity", (_req, res) => {
  res.json(latestTurbidity);
});

// Combined endpoint for website
app.get("/api/water-quality", (_req, res) => {
  console.log("[API] GET /api/water-quality");
  res.json({
    ph: latestPh,
    turbidity: latestTurbidity,
    timestamp: new Date().toISOString(),
  });
});

// ==================== OLD ENDPOINT (Backward compatibility) ====================
app.post("/api/data", (req, res) => {
  const { ph, ts } = req.body ?? {};

  if (ph !== undefined && !Number.isNaN(Number(ph))) {
    latestPh = {
      ph: Number.parseFloat(ph).toFixed(2),
      ts,
      timestamp: new Date().toISOString(),
    };
    console.log(`[pH via /api/data] Received: ${ph}`);
  }

  return res.status(201).json({ message: "Data received" });
});

app.get("/api/data", (_req, res) => {
  res.json(latestPh);
});

// Serve static build if available
const distDir = path.join(__dirname, "dist");
const publicDir = path.join(__dirname, "public");

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
} else if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log("===========================================");
  console.log("  Water Quality Monitoring Server");
  console.log("===========================================");
  console.log(`  Server running on: http://localhost:${PORT}`);
  console.log(`  Network access: http://10.109.132.199:${PORT}`);
  console.log("===========================================");
  console.log("  Endpoints available:");
  console.log("    POST /api/ph");
  console.log("    GET  /api/ph");
  console.log("    POST /api/turbidity");
  console.log("    GET  /api/turbidity");
  console.log("    GET  /api/water-quality");
  console.log("===========================================");
});
