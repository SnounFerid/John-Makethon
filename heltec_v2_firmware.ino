/**
 * Heltec V2 (ESP32) Firmware
 * WiFi-based Valve Controller
 * 
 * Features:
 * - WiFi connectivity (2.4GHz)
 * - REST API endpoints for valve control
 * - GPIO21 solenoid valve control
 * - Real-time status reporting
 * - Auto-reconnect on WiFi loss
 * 
 * Configuration:
 * 1. Update SSID and PASSWORD below
 * 2. Upload to Heltec V2 with Arduino IDE
 * 3. Serial monitor shows IP address
 * 4. Backend will connect via WiFi
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// ============================================
// CONFIGURATION - EDIT THESE
// ============================================
const char* SSID = "El FabSpace Lac";          // ← Update your WiFi SSID
const char* PASSWORD = "Think_Make_Share";   // ← Update your WiFi password
const int VALVE_PIN = 21;                      // GPIO21 for solenoid valve (Heltec default)
const int SERVER_PORT = 80;

// ============================================
// GLOBAL VARIABLES
// ============================================
WebServer server(SERVER_PORT);
String valveState = "CLOSED";
unsigned long lastStateChange = 0;
unsigned long stateChangeCount = 0;

// ============================================
// SETUP
// ============================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Initialize pins
  pinMode(VALVE_PIN, OUTPUT);
  digitalWrite(VALVE_PIN, LOW);  // Start with valve CLOSED
  
  Serial.println("\n\n");
  Serial.println("╔════════════════════════════════════════╗");
  Serial.println("║  Heltec V2 WiFi Valve Controller       ║");
  Serial.println("║  GPIO21 Solenoid Valve Control         ║");
  Serial.println("╚════════════════════════════════════════╝");
  Serial.println("");
  
  // Connect to WiFi
  connectToWiFi();
  
  // Setup routes
  setupRoutes();
  
  // Start server
  server.begin();
  Serial.println("✅ Web server started on port 80");
  printAccessInfo();
}

// ============================================
// MAIN LOOP
// ============================================
void loop() {
  // Handle WiFi reconnection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi disconnected, attempting reconnect...");
    connectToWiFi();
    delay(5000);
  }
  
  // Handle HTTP requests
  server.handleClient();
  
  delay(10);
}

// ============================================
// WIFI CONNECTION
// ============================================
void connectToWiFi() {
  Serial.println("");
  Serial.print("🔌 Connecting to WiFi: ");
  Serial.println(SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println("");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("✅ WiFi connected!");
    Serial.print("📍 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("📊 Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("❌ Failed to connect to WiFi");
    Serial.println("⚠️  Check SSID and PASSWORD settings");
  }
}

// ============================================
// PRINT INFO
// ============================================
void printAccessInfo() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("📡 API Endpoints:");
    Serial.print("   GET  http://");
    Serial.print(WiFi.localIP());
    Serial.println("/status");
    Serial.print("   POST http://");
    Serial.print(WiFi.localIP());
    Serial.println("/open");
    Serial.print("   POST http://");
    Serial.print(WiFi.localIP());
    Serial.println("/close");
    Serial.print("   GET  http://");
    Serial.print(WiFi.localIP());
    Serial.println("/info");
    Serial.println("");
  }
}

// ============================================
// VALVE CONTROL
// ============================================
void openValve(String reason) {
  digitalWrite(VALVE_PIN, HIGH);  // Set GPIO21 HIGH to open
  valveState = "OPEN";
  lastStateChange = millis();
  stateChangeCount++;
  
  Serial.println("🔓 VALVE OPENED");
  Serial.print("   Reason: ");
  Serial.println(reason);
  Serial.print("   Uptime: ");
  Serial.print(millis() / 1000);
  Serial.println("s");
}

void closeValve(String reason) {
  digitalWrite(VALVE_PIN, LOW);   // Set GPIO21 LOW to close
  valveState = "CLOSED";
  lastStateChange = millis();
  stateChangeCount++;
  
  Serial.println("🔒 VALVE CLOSED");
  Serial.print("   Reason: ");
  Serial.println(reason);
  Serial.print("   Uptime: ");
  Serial.print(millis() / 1000);
  Serial.println("s");
}

// ============================================
// API ROUTES
// ============================================
void setupRoutes() {
  // GET /status - Get valve status
  server.on("/status", HTTP_GET, []() {
    Serial.println("📨 GET /status request");
    StaticJsonDocument<256> doc;
    doc["valve_state"] = valveState;
    doc["uptime_ms"] = millis();
    doc["changes"] = stateChangeCount;
    
    String response;
    serializeJson(doc, response);
    server.sendHeader("Content-Type", "application/json");
    server.send(200, "application/json", response);
    
    Serial.print("📨 GET /status -> ");
    Serial.println(response);
  });
  
  // POST /open - Open valve
  server.on("/open", HTTP_POST, []() {
    Serial.println("📨 POST /open request");
    if (valveState != "OPEN") {
      openValve("Backend API request");
    }
    String response = "{\"status\":\"OPEN\",\"message\":\"Valve opened\",\"valve_state\":\"OPEN\"}";
    server.sendHeader("Content-Type", "application/json");
    server.send(200, "application/json", response);
    Serial.println(response);
  });
  
  // POST /close - Close valve
  server.on("/close", HTTP_POST, []() {
    Serial.println("📨 POST /close request");
    if (valveState != "CLOSED") {
      closeValve("Backend API request");
    }
    String response = "{\"status\":\"CLOSED\",\"message\":\"Valve closed\",\"valve_state\":\"CLOSED\"}";
    server.sendHeader("Content-Type", "application/json");
    server.send(200, "application/json", response);
    Serial.println(response);
  });
  
  // GET /info - Get device info
  server.on("/info", HTTP_GET, []() {
    Serial.println("📨 GET /info request");
    StaticJsonDocument<512> doc;
    doc["device"] = "Heltec V2 (ESP32)";
    doc["firmware_version"] = "1.0.0";
    doc["valve_pin"] = VALVE_PIN;
    doc["current_state"] = valveState;
    doc["uptime_seconds"] = millis() / 1000;
    doc["wifi_connected"] = (WiFi.status() == WL_CONNECTED);
    doc["wifi_ssid"] = WiFi.SSID();
    doc["ip_address"] = WiFi.localIP().toString();
    doc["mac_address"] = WiFi.macAddress();
    doc["rssi_dbm"] = WiFi.RSSI();
    doc["state_changes"] = stateChangeCount;
    
    String response;
    serializeJson(doc, response);
    server.sendHeader("Content-Type", "application/json");
    server.send(200, "application/json", response);
    Serial.println(response);
  });
  
  // Default 404
  server.onNotFound([]() {
    String response = "{\"error\":\"Endpoint not found\",\"available\":[\"/status\",\"/open\",\"/close\",\"/info\"]}";
    server.sendHeader("Content-Type", "application/json");
    server.send(404, "application/json", response);
  });
  
  Serial.println("✅ API routes configured");
}

/*
 * ============================================
 * SETUP INSTRUCTIONS FOR ARDUINO IDE
 * ============================================
 * 
 * 1. Install ESP32 Board Package:
 *    - File > Preferences
 *    - Add: https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
 *    - Tools > Board Manager > Search "ESP32" > Install
 * 
 * 2. Install Libraries:
 *    - Sketch > Include Library > Manage Libraries
 *    - Search and install:
 *      * "ArduinoJson" by Benoit Blanchon
 *      * "U8g2" (for OLED display)
 * 
 * 3. Board Configuration:
 *    - Tools > Board > ESP32 Arduino > "Heltec WiFi LoRa 32(V2)"
 *    - Tools > Upload Speed > 921600
 *    - Tools > Port > [Your COM Port]
 * 
 * 4. Upload:
 *    - Connect Heltec V2 via USB
 *    - Click Upload (→ button)
 * 
 * 5. Verify:
 *    - Open Serial Monitor (Tools > Serial Monitor)
 *    - Set Baud: 115200
 *    - Should see "Ready to receive commands"
 * 
 * ============================================
 */
