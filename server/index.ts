import "dotenv/config";
import express from "express";
import cors from "cors";
import { getRoosters, createRooster, updateRooster, deleteRooster } from './routes/roosters';
import { uploadImage, uploadMiddleware } from './routes/upload';
import { getScans, getScanById, createScan } from "./routes/scans";
import { getReports, createReport } from "./routes/reports";
import { getSession, requireAuth } from "./routes/auth";
import educationRoutes from "./routes/education";
import poseRoutes from "./routes/pose";

export function createServer() {
  const app = express();

  // CORS Middleware
  app.use((req, res, next) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:8080',
      'https://rooster-scan.vercel.app',
      'https://rooster-scan-git-main-josh-lacags-projects.vercel.app',
      'https://rooster-scan-fej9guyqx-josh-lacags-projects.vercel.app',
      /rooster-scan-.*-josh-lacags-projects\.vercel\.app$/,
      /ngrok-free\.dev$/
    ];
    
    const origin = req.headers.origin || '';
    if (allowedOrigins.some(o => o instanceof RegExp ? o.test(origin) : o === origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
  app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.get("/api/auth/session", getSession);

  // Rooster routes
  app.get("/api/roosters", getRoosters);
  app.post("/api/roosters", requireAuth, createRooster);
  app.put("/api/roosters/:id", requireAuth, updateRooster);
  app.delete("/api/roosters/:id", requireAuth, deleteRooster);

  // Scan routes
  app.get("/api/scans", getScans);
  app.get("/api/scans/:id", getScanById);
  app.post("/api/scans", requireAuth, createScan);

  // Report routes
  app.get("/api/reports", getReports);
  app.post("/api/reports", requireAuth, createReport);

  // Education routes
  app.use("/api/education", educationRoutes);

  // Pose detection routes
  app.use("/api/pose", poseRoutes);

  // Upload routes
  app.post("/api/upload", uploadMiddleware, uploadImage);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });


  // Health check
  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, ts: Date.now() });
  });

  return app;
}
