#include <WiFi.h>
#include <WiFiMulti.h> // 複数Wi-Fi対応
#include <WebServer.h>
#include <ESPmDNS.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <MPU6050.h>

Preferences prefs;
WebServer server(80);
WiFiMulti wifiMulti; // WiFiMultiインスタンス
MPU6050 mpu;

// ===== 状態 =====
String deviceID;
// デフォルト設定は削除し、setup内でWiFiMultiに追加します
String currentSSID = "";
String nodeIP = "";
unsigned long lastSend = 0;

// ===== Node.js =====
const int NODE_PORT = 3000;

// ===== AP =====
const char* AP_PASS = "testtube123";

// =====================
// Utility
// =====================
String macID() {
  uint64_t mac = ESP.getEfuseMac();
  return String((uint32_t)(mac & 0xFFFFFFFF), HEX);
}

// =====================
// AP Web UI
// =====================
void handleRoot() {
  Serial.println("🔎 Scanning networks...");
  int n = WiFi.scanNetworks();
  Serial.printf("✅ Found %d networks\n", n);

  String html =
    "<html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'><title>試験管設定</title>"
    "<style>body{font-family:sans-serif;padding:20px;max-width:400px;margin:auto;} input,select,button{font-size:16px;padding:8px;width:100%;box-sizing:border-box;margin:5px 0;} .status{padding:10px;border-radius:5px;margin-bottom:15px;}</style>"
    "</head><body>"
    "<h2>🧪 試験管 設定</h2>";

  if (WiFi.status() == WL_CONNECTED) {
    html += "<div class='status' style='background:#dff0d8;color:#3c763d'>✅ <b>Connected</b> (" + WiFi.SSID() + ")<br>IP: " + WiFi.localIP().toString() + "</div>";
  } else {
    html += "<div class='status' style='background:#f2dede;color:#a94442'>⚠️ <b>Disconnected</b><br>設定を入力してください</div>";
  }

  html +=
    "<form method='POST' action='/save'>"

    "<h3>1. Wi-Fi設定 (手動)</h3>"
    "現在、以下のWi-Fiに自動接続を試みます:<br>"
    "<ul>"
    "<li>30F772ACE2C2-2G</li>"
    "<li>NKZ-AP</li>"
    "<li>(手動設定されたSSID)</li>"
    "</ul>"
    "手動で特定のWi-Fiを指定する場合:<br>"
    "リストから選択:<br><select name='ssid_select'>"
    "<option value=''>-- リストから選択 --</option>";

  for (int i = 0; i < n; i++) {
    html += "<option value='" + WiFi.SSID(i) + "'>" + WiFi.SSID(i) + " (" + String(WiFi.RSSI(i)) + "dBm)</option>";
  }

  html +=
    "</select><br>"
    "または手入力:<br><input type='text' name='ssid_manual' placeholder='SSIDを直接入力' value='" + currentSSID + "'><br>"
    "パスワード:<br><input type='password' name='pass' placeholder='Wi-Fi Password'><br><br>"

    "<h3>2. サーバー設定</h3>"
    "PC IP Address:<br><input type='text' name='ip' value='" + nodeIP + "' placeholder='例: 192.168.1.15'><br><br>"

    "<input type='submit' value='保存して再起動' style='background:#4CAF50;color:white;border:none;padding:15px;font-weight:bold;cursor:pointer;width:100%'>"
    "</form></body></html>";

  server.send(200, "text/html", html);
}

void handleSave() {
  String ssid = server.arg("ssid_manual");
  if (ssid == "") ssid = server.arg("ssid_select");

  String pass = server.arg("pass");
  String ip = server.arg("ip");

  // SSIDが指定されていれば保存
  if (ssid != "") {
     prefs.putString("ssid", ssid);
  }

  if (pass.length() > 0) prefs.putString("pass", pass);
  if (ip.length() > 0) prefs.putString("nodeip", ip);

  // 表示用
  currentSSID = ssid;
  if(currentSSID == "") currentSSID = prefs.getString("ssid", "未設定");

  String msg = "<html><head><meta name='viewport' content='width=device-width, initial-scale=1'></head><body>";
  msg += "<h2>✅ 保存しました</h2>";
  msg += "<p>再起動して接続を試みます...</p>";
  ESP.restart();
}

// =====================
// Sensor Fusion Vars
// =====================
float filterAngle = 0;
unsigned long prevTime = 0;

// =====================
// Send Angle
// =====================
void sendAngle(float angle) {
  if (WiFi.status() != WL_CONNECTED) return;
  if (nodeIP == "") return;

  HTTPClient http;
  String url = "http://" + nodeIP + ":" + String(NODE_PORT) + "/gyro";

  // タイムアウトを極短に設定してラグを防ぐ
  http.setTimeout(100);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  String body = "{\"id\":\"" + deviceID + "\",\"angle\":" + String(angle, 2) + "}";
  int code = http.POST(body);
  http.end();
}

// =====================
// Setup
// =====================
void setup() {
  Serial.begin(115200);
  delay(1000);

  deviceID = "testtube-" + macID();
  Serial.println("🧪 BOOT OK: " + deviceID);

  prefs.begin("wifi", false);

  // ★ 強制的にコードの設定("indo")を使うため、以前の保存値読み込みを無効化
  // wifiSSID = prefs.getString("ssid", "");
  // wifiPASS = prefs.getString("pass", "");

  // サーバーのIPだけは前回保存したものを読み込む（変わる可能性が高いため）
  nodeIP = prefs.getString("nodeip", "");

  // 保存されたWi-Fi設定があれば読み込む
  currentSSID = prefs.getString("ssid", "");
  String currentPASS = prefs.getString("pass", "");

  // XIAO ESP32C3 I2C Pin: SDA=6 (D4), SCL=7 (D5)
  Wire.begin(6, 7);
  mpu.initialize();

  // センサーなくても起動は止めない（設定のため）
  if (!mpu.testConnection()) {
    Serial.println("❌ MPU6050 not found (Check wiring)");
  } else {
    Serial.println("✅ MPU6050 OK");
  }

  // ★重要: APモードとStationモードを両立させる
  WiFi.mode(WIFI_AP_STA);

  // 設定用APを起動（常に表示される）
  WiFi.softAP(deviceID.c_str(), AP_PASS);
  Serial.print("📡 AP Started: ");
  Serial.println(deviceID);
  Serial.println("IP: 192.168.4.1");

  // === Wi-Fi (WiFiMulti) 設定 ===
  // 1. 家のWi-Fi
  wifiMulti.addAP("30F772ACE2C2-2G", "2215090605215");
  // 2. 学校のWi-Fi
  wifiMulti.addAP("NKZ-AP", "nkzap-01");
  // 3. その他のWi-Fi (indo)
  wifiMulti.addAP("indo", "aaaapopx");

  // 4. 手動設定されたWi-Fiがあれば追加
  if (currentSSID != "") {
    wifiMulti.addAP(currentSSID.c_str(), currentPASS.c_str());
    Serial.println("ℹ️ Custom Wi-Fi loaded: " + currentSSID);
  }

  Serial.println("📶 Connecting to Wi-Fi...");
  // 接続処理は loop() 内で run() が呼ばれることで自動で行われますが、
  // ここで一度キックしておく

  server.on("/", handleRoot);
  server.on("/save", HTTP_POST, handleSave);
  server.begin();

  prevTime = millis();
}

// =====================
// Loop
// =====================
unsigned long lastConnectAttempt = 0;

void loop() {
  // ★最優先: Webサーバーのリクエスト処理
  server.handleClient();

  unsigned long now = millis();

  // 1. Wi-Fi接続再試行 (頻繁にやるとAPが重くなるため 2秒おき)
  if (WiFi.status() != WL_CONNECTED) {
    if (now - lastConnectAttempt > 2000) {
      wifiMulti.run();
      lastConnectAttempt = now;
    }
  }

  // 2. センサー読み取りと送信
  float dt = (now - prevTime) / 1000.0;
  prevTime = now;

  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  // ---------------------------------------------------------
  // 修正版: 物理配置（USB上）による補正 ver2
  // ---------------------------------------------------------
  // 右に行き過ぎると反転する、左が反応しないという現象への対策。
  // atan2の引数の順序と、軸の符号を調整します。

  // 1. 物理的な上下反転を補正 (重力が逆にかかるため)
  ay = -ay;
  // ★修正: 左右が逆になる現象への対策
  // 左に傾けて右に行くなら、横軸(ax)のプラスマイナスも入れ替える必要があります。
  ax = -ax;

  // 2. 角度計算
  // atan2(y, x) は -180 ~ 180 を返します。
  // 試験管の「立ち」状態を0度にしたい場合:
  // 縦軸(ay)をX側、横軸(ax)をY側に入れます -> atan2(ax, ay)
  float accAngle = atan2(ax, ay) * 180.0 / PI;

  // 3. 値のクリップ (チャタリング防止)
  // 180度付近での急激な反転を防ぐため、単純に制限をかけます。
  // -90度(左真横) ～ 90度(右真横) 程度しか使わない想定であればこれで安定します。
  if (accAngle > 90) accAngle = 90;
  if (accAngle < -90) accAngle = -90;

  // 簡易ローパスフィルタ
  filterAngle = filterAngle * 0.8 + accAngle * 0.2;

  // 3. データ送信 (Wi-Fi繋がっている時だけ)
  if (WiFi.status() == WL_CONNECTED && now - lastSend > 50) {
    sendAngle(filterAngle);
    lastSend = now;
  }
}
