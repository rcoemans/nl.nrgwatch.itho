# Homey App Brief: Insight Devices 2 | Awtrix device

## Purpose

Extend the Homey app **app name:** `Insight Devices` with the device 'Awtrix 3'

---

# Device Portfolio

The app must support the following devices:

1. Floor Heating Monitor [Done]
2. Ground Level Monitor [Done]
3. NRG-Watch Itho CVE [Done]
4. Custom MQTT Sensor [Done]
5. Awtrix 3

Each device must have a clear pairing flow, settings, capabilities, Insights behavior, and flow card support.

---

# Device 5: Awtrix 3

Background information: https://blueforcer.github.io/awtrix3/#/api

## Description

Integrates an AWTRIX 3 LED matrix device into Homey via MQTT.

This device allows:
- Monitoring device status such as temperature, humidity, brightness, uptime and WiFi signal
- Viewing device health and diagnostics
- Sending messages, notifications and custom apps to the display

The device acts as both:
- a **sensor device** (reading telemetry)
- a **display controller** (sending commands)

---

## Device type

- **Internal device type / id:** `awtrix_3`

## Device class

- Recommended Homey class: `sensor`

---

## Pairing / settings

### Required settings

1. **Base topic**
   - string
   - required
   - example: `awtrix_55f85c`

2. **Status topic**
   - default: `<base>/stats`

3. **Command topic**
   - default: `<base>/custom`

4. **Notify topic**
   - default: `<base>/notify`

5. **QoS**
   - default: 0

6. **Retain flag**
   - default: false

---

### Expected payload

The preferred payload is a JSON object.

Example:

```json
{"bat":100,"bat_raw":677,"type":0,"lux":26,"ldr_raw":721,"ram":137572,"bri":63,"temp":19,"hum":32,"uptime":577,"wifi_signal":-61,"messages":0,"version":"0.98","indicator1":false,"indicator2":false,"indicator3":false,"app":"","uid":"awtrix_55f85c","matrix":true,"ip_address":"192.168.1.123"}
```

Uptime is in seconds.

---

## Parsing rules

- `temp` → temperature (°C)
- `hum` → humidity (%)
- `lux` → ambient light (lux)
- `bri` → brightness (%)
- `wifi_signal` → RSSI (dBm)
- `uptime` → uptime (seconds)
- `bat` → battery percentage
- `messages` → number of active messages
- `app` → current app name
- `version` → firmware version
- `ip_address` → device IP

Rules:

- Ignore missing fields
- Ignore invalid values and log errors
- Keep last valid value if parsing fails

---

## Calculation

- Not needed

---

## Capability naming

- `measure_temperature`
- `measure_humidity`
- `measure_luminance`
- `measure_battery`
- `measure_signal_strength`
- `measure_uptime`
- `measure_brightness`
- `measure_messages`
- `device_app`
- `device_version`
- `device_ip`

---

## Capabilities

### Core

- Temperature
- Humidity
- Brightness
- Ambient Light (lux)
- WiFi Signal Strength
- Battery Level

### Secondary

- Uptime
- Message Count
- Current App
- Firmware Version
- IP Address

---

## Insights

Recommended to log:

- Temperature
- Humidity
- Brightness
- Ambient Light
- WiFi Signal Strength
- Battery Level
- Message Count

---

## Trigger cards

- Temperature changed
- Humidity changed
- Brightness changed
- Ambient light changed
- WiFi signal changed
- Battery level changed
- Message count changed
- Current app changed
- Device came online
- Device went offline

---

## Condition cards

Use consistent comparison operators:

- `lt` = lower than
- `lte` = lower than or equal
- `gt` = greater than
- `gte` = greater than or equal

Conditions:

- Temperature is `[lt | lte | gt | gte]` `[value]`
- Humidity is `[lt | lte | gt | gte]` `[value]`
- Brightness is `[lt | lte | gt | gte]` `[value]`
- Ambient light is `[lt | lte | gt | gte]` `[value]`
- WiFi signal is `[lt | lte | gt | gte]` `[value]`
- Battery level is `[lt | lte | gt | gte]` `[value]`
- Message count is `[lt | lte | gt | gte]` `[value]`
- Current app equals `[value]`
- Device is online

---

## Action cards

### Send notification

Publishes to `<base>/notify`

```json
{
  "text": "Hello World",
  "color": "#00FF00"
}
```

---

### Send custom app

Publishes to `<base>/custom`

```json
{
  "name": "homey",
  "text": "Heating OK",
  "color": "#00AEEF"
}
```

---

### Clear screen

Publishes:

```json
{
  "name": "clear"
}
```

---

### Set brightness

Publishes:

```json
{
  "bri": 80
}
```

---

## Notes

- Keep payload expectations strict and simple
- Prefer JSON object payloads
- Some AWTRIX features may differ per firmware version
- Avoid overloading UI with too many fields

---

***EXTRA INPUR FOR ACTION FLOW CARDS***

# Awtrix 3 – Action Flow Cards (Insight Devices)

## Overview

The Awtrix 3 device is a **visual output device**, making Action flow cards a key feature.

These actions allow Homey to display insights, alerts, and system data directly on the Awtrix LED matrix.

---

# 🚀 Core Action Cards (Must-have)

## 📢 Show Notification

**Name:** Show notification on display  

**Description:** Displays a temporary message on the Awtrix screen.

### Inputs
- Text (string)
- Color (optional, hex)
- Duration (seconds, optional)
- Icon (optional)

### MQTT payload
```json
{
  "text": "Washing done",
  "color": "#00FF00",
  "duration": 5
}
```

### Use cases
- Washing machine finished
- Doorbell pressed
- Alarm triggered

---

## 🧩 Show Custom App

**Name:** Show custom app on display  

**Description:** Creates or updates a named app on the Awtrix.

### Inputs
- App name
- Text
- Color
- Icon (optional)
- Lifetime (optional)

### MQTT payload
```json
{
  "name": "heating",
  "text": "ΔT: 5.4°C",
  "color": "#00AEEF"
}
```

### Use cases
- Show ΔT
- Show energy usage
- Show sensor values

---

## 🔄 Remove Custom App

**Name:** Remove app from display  

### Inputs
- App name

### MQTT payload
```json
{
  "name": "heating"
}
```

---

## 🧹 Clear Screen

**Name:** Clear display  

### MQTT payload
```json
{
  "name": "clear"
}
```

---

## 💡 Set Brightness

**Name:** Set brightness  

### Inputs
- Brightness (0–100)

### MQTT payload
```json
{
  "bri": 80
}
```

---

# ⚡ High-Value Smart Integrations

## 🌡️ Show Insight Value

**Name:** Show Insight value on display  

### Inputs
- Text template (e.g. "Flow: {{value}}°C")

### Use cases
- Show real-time sensor values

---

## 📊 Show Multi-line Status

**Name:** Show multi-line status  

### Inputs
- Line 1
- Line 2
- Color

### MQTT payload
```json
{
  "text": "Flow:35 Return:30",
  "color": "#FFFFFF"
}
```

---

## 🚨 Show Alert

**Name:** Show alert  

### Inputs
- Text
- Color (default red)
- Blink (optional)

### MQTT payload
```json
{
  "text": "WATER LEAK!",
  "color": "#FF0000"
}
```

---

# 🎯 Advanced Actions

## 🎨 Set Indicator LEDs

**Name:** Set indicator LEDs  

### Inputs
- Indicator 1 / 2 / 3 (on/off)

---

## 🔁 Toggle App Visibility

**Name:** Enable / disable app  

---

## 🕒 Show Timer / Countdown

### MQTT payload
```json
{
  "text": "Timer 10m",
  "progress": 50
}
```

---

# 🧠 Best Practices

## Group actions logically

### 📢 Display
- Show notification
- Show alert
- Clear display

### 🧩 Apps
- Show custom app
- Remove custom app

### ⚙️ Control
- Set brightness
- Indicators
