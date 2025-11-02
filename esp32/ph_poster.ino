#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <esp_sntp.h>

// Update with your Wi-Fi credentials
const char* WIFI_SSID = "Dollar";
const char* WIFI_PASSWORD = "Balaji1432";

// Production server URL (Render deployment)
const char* SERVER_URL = "https://water-quality-2acr.onrender.com";

// pH sensor configuration
const int PH_SENSOR_PIN = 34;          // ADC input pin
const float ADC_REFERENCE = 3.3f;      // ESP32 ADC reference voltage (volts)
const uint16_t ADC_RESOLUTION = 4095;  // 12-bit ADC

// Calibration constants (tune after calibrating your probe)
const float VOLTAGE_AT_PH7 = 2.020f; // Voltage output when pH = 7.0 (example)
const float PH_SLOPE = -0.172f;      // Voltage change per pH unit (volts/pH)

// Turbidity sensor configuration
const int TURBIDITY_SENSOR_PIN = 35;   // ADC input pin for turbidity probe
const float TURBIDITY_VOLTAGE_CLEAR = 2.5f; // Sensor voltage when water is clear (example)

// Timing
const uint32_t SAMPLE_INTERVAL_MS = 3000; // Match frontend polling interval

struct SensorSample {
  float value;
  float voltage;
};

SensorSample readPhSample();
SensorSample readTurbiditySample();
String buildIsoTimestamp();
const char* classifyTurbidity(float ntu);
bool postJsonPayload(const char* path, const StaticJsonDocument<256>& doc);

void postPhReading(const SensorSample& phSample, const String& timestamp);
void postTurbidityReading(const SensorSample& turbiditySample, const String& timestamp);

void setup() {
  Serial.begin(115200);
  delay(100);

  Serial.println();
  Serial.println("ESP32 Water Quality Monitor starting...");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }
  Serial.println();
  Serial.print("Connected! IP address: ");
  Serial.println(WiFi.localIP());

  // Kick off SNTP time sync so timestamps are accurate
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
}

void loop() {
  SensorSample phSample = readPhSample();
  SensorSample turbiditySample = readTurbiditySample();
  String timestamp = buildIsoTimestamp();

  Serial.printf(
    "Measured pH: %.2f (%.3f V) | Turbidity: %.2f NTU (%.3f V)\n",
    phSample.value,
    phSample.voltage,
    turbiditySample.value,
    turbiditySample.voltage
  );

  postPhReading(phSample, timestamp);
  postTurbidityReading(turbiditySample, timestamp);

  delay(SAMPLE_INTERVAL_MS);
}

SensorSample readPhSample() {
  const uint8_t NUM_SAMPLES = 12;
  uint32_t accumulated = 0;

  for (uint8_t i = 0; i < NUM_SAMPLES; ++i) {
    accumulated += analogRead(PH_SENSOR_PIN);
    delay(12);
  }

  float averageCounts = static_cast<float>(accumulated) / NUM_SAMPLES;
  float voltage = (averageCounts / ADC_RESOLUTION) * ADC_REFERENCE;

  // Convert voltage to pH using calibration constants
  float ph = 7.0f + (voltage - VOLTAGE_AT_PH7) / PH_SLOPE;

  SensorSample sample = {ph, voltage};
  return sample;
}

SensorSample readTurbiditySample() {
  const uint8_t NUM_SAMPLES = 24;
  uint32_t accumulated = 0;

  for (uint8_t i = 0; i < NUM_SAMPLES; ++i) {
    accumulated += analogRead(TURBIDITY_SENSOR_PIN);
    delay(8);
  }

  float averageCounts = static_cast<float>(accumulated) / NUM_SAMPLES;
  float voltage = (averageCounts / ADC_RESOLUTION) * ADC_REFERENCE;

  // Polynomial fit for SEN0189-style turbidity sensor; adjust after calibration
  float ntu = -1120.4f * voltage * voltage + 5742.3f * voltage - 4352.9f;

  if (ntu < 0.0f) {
    ntu = 0.0f;
  }

  SensorSample sample = {ntu, voltage};
  return sample;
}

String buildIsoTimestamp() {
  if (sntp_get_sync_status() != SNTP_SYNC_STATUS_COMPLETED) {
    return String();
  }

  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return String();
  }

  char isoBuffer[32];
  strftime(isoBuffer, sizeof(isoBuffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(isoBuffer);
}

const char* classifyTurbidity(float ntu) {
  if (ntu > 15.0f) {
    return "Highly Cloudy";
  }
  if (ntu > 10.0f) {
    return "Cloudy";
  }
  if (ntu > 5.0f) {
    return "Moderate Turbidity";
  }
  if (ntu > 1.0f) {
    return "Slightly Cloudy";
  }
  return "Clear";
}

bool postJsonPayload(const char* path, const StaticJsonDocument<256>& doc) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnected, skipping POST");
    return false;
  }

  HTTPClient http;
  char urlBuffer[256];
  snprintf(urlBuffer, sizeof(urlBuffer), "%s%s", SERVER_URL, path);

  if (!http.begin(urlBuffer)) {
    Serial.println("Failed to begin HTTP connection");
    return false;
  }

  http.addHeader("Content-Type", "application/json");

  String payload;
  serializeJson(doc, payload);

  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    Serial.printf("POST %s -> %d\n", path, httpResponseCode);
  } else {
    Serial.printf("POST %s failed: %s\n", path, http.errorToString(httpResponseCode).c_str());
  }

  http.end();
  return httpResponseCode > 0;
}

void postPhReading(const SensorSample& phSample, const String& timestamp) {
  StaticJsonDocument<256> doc;
  doc["ph"] = phSample.value;
  doc["voltage"] = phSample.voltage;
  doc["raw_calculated"] = true;
  if (timestamp.length() > 0) {
    doc["ts"] = timestamp;
  }

  postJsonPayload("/api/ph", doc);
}

void postTurbidityReading(const SensorSample& turbiditySample, const String& timestamp) {
  StaticJsonDocument<256> doc;
  doc["turbidity"] = turbiditySample.value;
  doc["voltage"] = turbiditySample.voltage;
  doc["status"] = classifyTurbidity(turbiditySample.value);
  doc["reference_voltage"] = TURBIDITY_VOLTAGE_CLEAR;
  if (timestamp.length() > 0) {
    doc["ts"] = timestamp;
  }

  postJsonPayload("/api/turbidity", doc);
}
