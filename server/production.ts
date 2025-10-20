import { createServer } from "./index.js";
import path from "path";
import express from "express";

const app = createServer();
const PORT = parseInt(process.env.PORT || "3000", 10);

// Serve static files from client build
app.use(express.static(path.join(process.cwd(), "dist/client")));

// Catch-all handler for SPA routing
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "Not found" });
  }
  
  res.sendFile(path.join(process.cwd(), "dist/client/index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
});
