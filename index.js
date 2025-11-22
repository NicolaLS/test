import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Config -----------------------------------------------------------------

// Set this in Railway for production, e.g.
// PUBLIC_BASE_URL=https://test-production-df58.up.railway.app
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || null;

// Tell Express we're behind a proxy (Railway) so req.protocol can be 'https'
app.set("trust proxy", 1);

// Parse JSON bodies (for /api/logs)
app.use(express.json({ limit: "1mb" }));

// Simple request logger
app.use((req, _res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url}`,
    `ID=${req.get("ID") || "-"}`,
    `Access-Token=${req.get("Access-Token") || "-"}`
  );
  next();
});

// Helper to build absolute URLs suitable for TRMNL
function baseUrl(req) {
  if (PUBLIC_BASE_URL) {
    return PUBLIC_BASE_URL.replace(/\/+$/, ""); // strip trailing slash
  }

  const host = req.get("host");
  if (!host) return "";

  // Default to https for Railway hostnames
  if (host.endsWith(".up.railway.app")) {
    return `https://${host}`;
  }

  // Fallback to whatever Express thinks
  return `${req.protocol}://${host}`;
}

// ---- Static image -----------------------------------------------------------

// Serve the test image
app.get("/test.bmp", (req, res) => {
  const filePath = path.join(__dirname, "test.bmp");
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending test.bmp:", err);
    }
  });
});

// ---- API: /api/setup --------------------------------------------------------

// Returns a fixed api_key & friendly_id for any TRMNL device
app.get("/api/setup", (req, res) => {
  const mac = req.get("ID") || "unknown";
  console.log("SETUP from", mac);

  const url = `${baseUrl(req)}/test.bmp`;

  res.status(200).json({
    status: 200, // important: numeric 200
    api_key: "TEST-ACCESS-TOKEN",
    friendly_id: "ABC123",
    image_url: url, // must be absolute, no redirects
    filename: "setup-test"
  });
});

// ---- API: /api/display ------------------------------------------------------

// Always returns the same test image
app.get("/api/display", (req, res) => {
  const mac = req.get("ID") || "unknown";
  const token = req.get("Access-Token") || "none";
  const refreshHeader = req.get("Refresh-Rate");
  console.log("DISPLAY from", mac, "token:", token);

  const url = `${baseUrl(req)}/test.bmp`;

  res.status(200).json({
    status: 0, // "OK, show this image"
    image_url: url,
    filename: "test-image",
    update_firmware: false,
    firmware_url: null,
    refresh_rate: refreshHeader || "1800",
    reset_firmware: false
  });
});

// ---- API: /api/logs (from TRMNL) -------------------------------------------

// TRMNL firmware can POST logs here when things go wrong
app.post("/api/logs", (req, res) => {
  console.log("TRMNL LOG:", JSON.stringify(req.body, null, 2));
  res.json({ status: 0 });
});

// Optional basic health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// ---- Start server -----------------------------------------------------------

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`TRMNL test server listening on port ${port}`);
});

