import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple helper to build absolute URLs
function baseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

// Serve the test image
app.get("/test.bmp", (req, res) => {
  res.sendFile(path.join(__dirname, "test.bmp"));
});

// /api/setup – returns a fixed api_key & friendly_id for any MAC
app.get("/api/setup", (req, res) => {
  const mac = req.header("ID") || "unknown";
  console.log("SETUP from", mac);

  res.json({
    status: 200,
    api_key: "TEST-ACCESS-TOKEN",
    friendly_id: "ABC123",
    image_url: `${baseUrl(req)}/test.bmp`,
    filename: "setup-test"
  });
});

// /api/display – always returns the same test image
app.get("/api/display", (req, res) => {
  const mac = req.header("ID") || "unknown";
  const token = req.header("Access-Token");
  console.log("DISPLAY from", mac, "token:", token);

  res.json({
    status: 0,
    image_url: `${baseUrl(req)}/test.bmp`,
    filename: "test-image",
    update_firmware: false,
    firmware_url: null,
    refresh_rate: req.header("Refresh-Rate") || "1800",
    reset_firmware: false
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`TRMNL test server listening on port ${port}`);
});


