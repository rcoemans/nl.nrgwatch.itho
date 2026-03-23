# Blueprint — Homey App: NRG.Watch Itho add-on

**App name:** `NRG.Watch Itho add-on`  
**App id:** `nl.nrgwatch.itho` 
**App description** `Control and monitor your Itho ventilation system via MQTT or API in Homey (requires the NRG.Watch Itho add-on).` 
**Document type:** Functional + technical blueprint  
**Format:** Markdown  
**Generated:** 2026-03-23 15:56:17

---

## 1. Goal

Create a Homey app that integrates Itho devices through two interchangeable connection methods:

1. **NRG.Watch Itho (MQTT)**
2. **NRG.Watch Itho (API)**

The app must abstract the transport layer as much as possible.  
Users should not need to know internal MQTT topic names like `state`, `ithostatus`, `lastcmd`, `remotesinfo`, or HTTP query details such as `get=ithostatus` or `command=medium`.

The Homey experience should therefore be as uniform as possible between the MQTT and API devices:
- similar device capabilities
- similar Flow trigger cards
- similar Flow condition cards
- similar Flow action cards
- same terminology where possible
- same user-facing explanations where possible

The **app itself has no configuration UI**.  
All configuration belongs to the **device settings** of each added device.

---

## 2. App scope

### In scope
- One Homey app with two drivers
- One MQTT-based device driver
- One HTTP API-based device driver
- Unified status abstraction
- Unified fan control abstraction
- Unified Flow cards
- Device-level configuration only
- Logging for MQTT connectivity
- Support for generic Itho read/write features described in the provided API/MQTT documentation
- Support for selected advanced features when hardware supports them

### Out of scope
- App-wide settings page
- Manual user configuration of internal MQTT subtopics
- Exposing low-level protocol details unless needed in advanced device diagnostics
- Complex hardware auto-discovery unless added later
- Unsafe direct exposure of dangerous low-level controls without clear safeguards

---

## 3. App structure

## 3.1 Top-level app
- App name: **NRG.Watch Itho add-on**
- App id: **nl.nrgwatch.itho**
- Homey SDK target: preferably **Homey Apps SDK v3**
- App settings page: **none**
- Permissions:
  - network access for HTTP API
  - network access for MQTT broker
  - local storage / settings
  - logging

## 3.2 Drivers
The app contains two drivers:

### Driver A
**Name:** `NRG.Watch Itho (MQTT)`  
**Purpose:** Connect to an Itho add-on via MQTT.

### Driver B
**Name:** `NRG.Watch Itho (API)`  
**Purpose:** Connect to an Itho add-on via the Web API.

---

## 4. Design principles

1. **Abstraction first**  
   The user interacts with concepts like:
   - fan speed
   - preset
   - timer
   - online/offline
   - temperature
   - humidity
   - co2
   - error state

   The user should not need to think in terms of:
   - `itho/cmd`
   - `itho/state`
   - `itho/ithostatus`
   - `api.html?get=currentspeed`

2. **Transport-independent flows**  
   A flow made for the MQTT device should feel almost the same as a flow for the API device.

3. **Capability-driven UI**  
   If a device does not provide a certain value, the capability should either:
   - remain unavailable / hidden where technically possible
   - show “unknown” / unavailable internally
   - avoid misleading the user

4. **Graceful degradation**  
   Different Itho models and firmware versions expose different labels. The app must tolerate missing keys.

5. **Safe defaults**  
   Advanced or potentially risky controls should not be exposed as normal consumer controls unless clearly supported and safe.

---

## 5. Functional model

The app should normalize the incoming Itho data into a common internal state object like:

```json
{
  "online": true,
  "transport": "mqtt or api",
  "currentSpeed": 121,
  "targetSpeed": 120,
  "preset": "medium",
  "temperature": 23.0,
  "humidity": 40.1,
  "co2": null,
  "fanSpeedRpm": 921,
  "fanSetpointRpm": 920,
  "ventilationSetpointPct": 30,
  "errorCode": 0,
  "selection": 7,
  "startupCounter": 700,
  "totalOperationHours": 27031,
  "absenceMinutes": 0,
  "lastCommand": "medium",
  "rawStatus": {}
}
```

This abstraction is what powers Homey capabilities, Flow cards, tokens, insights, and availability.

---

## 6. Device definitions

# 6.1 Device: NRG.Watch Itho (MQTT)

## 6.1.1 Purpose
Connects to the Itho add-on through MQTT using the provided broker settings and a user-configurable base topic.

The app internally derives all relevant topics from the base topic.

Example with base topic `itho`:
- state topic → `itho/state`
- status topic → `itho/ithostatus`
- remotes info topic → `itho/remotesinfo`
- last command topic → `itho/lastcmd`
- command topic → `itho/cmd`
- lwt topic → `itho/lwt`

The user should only configure:
- broker connection
- authentication
- TLS behavior
- optional LWT publishing
- base topic

The user should **not** configure:
- separate command topic
- separate state topic
- separate status topic
- separate remotes info topic
- separate last command topic

## 6.1.2 Pairing
Suggested pairing flow:
1. Add device
2. Enter a device name
3. Fill in MQTT connection settings
4. Fill in MQTT base topic, default `itho`
5. Save settings
6. Attempt connection
7. Subscribe to derived topics
8. Show connection test result
9. Finish pairing

Optional enhancement:
- “Test connection” button during pairing that attempts a broker connection and basic subscription before completing pairing

## 6.1.3 Device settings
The following settings exist on the device.

### Section: MQTT connectivity

#### 1. MQTT broker (IP address or DNS)
- key: `mqtt_host`
- type: string
- required: yes
- default: `localhost`
- help text: Hostname or IP address of the MQTT broker.

#### 2. Port number
- key: `mqtt_port`
- type: number
- required: yes
- default: `1883`
- validation:
  - integer
  - range 1–65535
- help text: Port used by the MQTT broker.

#### 3. Use a secure connection with the broker (TLS)
- key: `mqtt_tls`
- type: checkbox
- default: off
- help text: Enable TLS when the broker requires a secure connection.

#### 4. Disable certificate validation (when using self-signed certificates)
- key: `mqtt_tls_insecure`
- type: checkbox
- default: off
- only enabled when: `mqtt_tls = true`
- help text: Allows self-signed or otherwise untrusted certificates. Use only when needed.

#### 5. Keepalive time (seconds)
- key: `mqtt_keepalive`
- type: number
- default: empty
- fallback used by app when empty: `60`
- validation:
  - integer
  - range 0–65535
- help text: MQTT keepalive interval. Leave empty to use the recommended fallback.

#### 6. Username
- key: `mqtt_username`
- type: string
- default: empty
- required: no

#### 7. Password
- key: `mqtt_password`
- type: password string
- default: empty
- required: no
- masked while typing: yes

#### 8. Provide your own client id to be used when connecting to the broker
- key: `mqtt_use_custom_client_id`
- type: checkbox
- default: off

#### 9. Client id
- key: `mqtt_client_id`
- type: string
- default: empty
- only enabled when: `mqtt_use_custom_client_id = true`
- validation:
  - non-empty when enabled
- help text: Leave disabled to let the app generate a stable client id automatically.

### Section: MQTT base topic

#### 10. MQTT base topic
- key: `mqtt_base_topic`
- type: string
- required: yes
- default: `itho`
- validation:
  - trimmed string
  - must not begin or end with `/`
  - must not contain wildcard characters `#` or `+`
- help text: Base topic used by the Itho add-on. The app derives all internal topics automatically.

### Section: LWT help text
Display this plain help text:

> LWT in MQTT stands for Last Will and Testament. It is a core feature of the MQTT protocol designed for IoT and messaging applications to detect when a client disconnects unexpectedly from the MQTT broker.

### Section: LWT configuration

#### 11. Use LWT
- key: `mqtt_use_lwt`
- type: checkbox
- default: off
- help text: Publish a Last Will and Testament when connecting.

#### 12. Topic for LWT
- key: `mqtt_lwt_topic`
- type: string
- default: empty
- enabled only when: `mqtt_use_lwt = true`
- validation:
  - non-empty when enabled

#### 13. LWT message
- key: `mqtt_lwt_message`
- type: string
- default: empty
- enabled only when: `mqtt_use_lwt = true`
- validation:
  - non-empty when enabled

### Section: Action button

#### Save settings
Behavior:
- validate all input
- store settings
- reconnect the MQTT client if settings affecting connectivity changed
- re-subscribe to derived topics if base topic changed
- write a log entry for success or failure
- show user feedback on success or error

### Section: MQTT broker log

#### UI requirements
- section title: `MQTT broker log`
- multiline text field / text area
- starts empty
- auto-expands vertically as lines are added
- long lines do not wrap
- horizontal scrolling may be used

#### Retrieve log button
Behavior:
- reload current in-memory and/or persisted log entries into the visible log area

#### Logging expectations
The log should include entries such as:
- app startup
- settings loaded
- connecting to broker
- connected to broker
- disconnected from broker
- reconnect attempt
- subscription added
- subscription removed
- malformed payload received
- device parse error
- command publish success
- command publish failure

Each line should preferably include a timestamp, for example:

```text
2026-03-23 10:01:05 Connected to broker mqtt://192.168.1.10:1883
2026-03-23 10:01:05 Subscription added itho/ithostatus
2026-03-23 10:01:05 Subscription added itho/state
2026-03-23 10:01:11 Command publish success preset=medium
```

## 6.1.4 MQTT topic abstraction
The MQTT device should internally derive these topics from the base topic:

| Logical meaning | Derived topic |
|---|---|
| State | `<base>/state` |
| Itho status | `<base>/ithostatus` |
| Remotes info | `<base>/remotesinfo` |
| Last command info | `<base>/lastcmd` |
| Command | `<base>/cmd` |
| Last will | `<base>/lwt` |

Example with base topic `itho`:
- `itho/state`
- `itho/ithostatus`
- `itho/remotesinfo`
- `itho/lastcmd`
- `itho/cmd`
- `itho/lwt`

The user only sees the base topic.

## 6.1.5 MQTT read behavior
The device should subscribe to:
- `<base>/state`
- `<base>/ithostatus`
- `<base>/remotesinfo` (optional, for future expansion and diagnostics)
- `<base>/lastcmd` (optional, for diagnostics and flow enrichment)
- `<base>/lwt` (if relevant to availability)

### Expected payloads
- **state**: numeric value `0–255`
- **ithostatus**: JSON object
- **remotesinfo**: JSON object
- **lastcmd**: string or JSON depending on implementation
- **lwt**: online/offline style state if published by the add-on

### MQTT write behavior
Commands are published to:
- `<base>/cmd`

Supported payload patterns:
- full JSON object, preferred
- single-value shortcut where supported by the add-on for simple commands like `medium` or `120`

The Homey app should always prefer predictable JSON output internally unless a known shortcut is explicitly supported and simpler.

### Recommended outgoing MQTT payload examples
Set preset:
```json
{ "command": "medium" }
```

Set speed:
```json
{ "speed": 150 }
```

Set speed with timer:
```json
{ "speed": 150, "timer": 900 }
```

Clear queue:
```json
{ "clearqueue": "true" }
```

Virtual remote command:
```json
{ "vremotecmd": "high" }
```

Virtual remote by index:
```json
{ "vremotecmd": "high", "vremoteindex": 1 }
```

RF remote command:
```json
{ "rfremotecmd": "high" }
```

## 6.1.6 MQTT availability
Device availability should be based on a combination of:
- active broker connection
- successful subscription status
- recent messages received from the device
- optional LWT state if available

Preferred behavior:
- if broker disconnected → device unavailable
- if LWT explicitly says offline → device unavailable
- if no messages received for a configurable stale period → device may show warning but not immediately unavailable

---

# 6.2 Device: NRG.Watch Itho (API)

## 6.2.1 Purpose
Connects to the Itho add-on through its Web API.

The user configures:
- IP address or DNS name
- optional username
- optional password

The app internally performs the needed GET requests and maps them to the same abstract device model used by the MQTT driver.

## 6.2.2 Pairing
Suggested pairing flow:
1. Add device
2. Enter a device name
3. Enter IP address or DNS name
4. Optionally enter username and password
5. Save settings
6. Test API availability by requesting status
7. Finish pairing

Optional enhancement:
- “Test connection” button that sends a lightweight request before completion

## 6.2.3 Device settings

### 1. IP address or DNS
- key: `api_host`
- type: string
- required: yes
- default: empty
- help text: IP address or DNS name of the Itho add-on.
- examples:
  - `192.168.4.1`
  - `itho.local`

### 2. Username
- key: `api_username`
- type: string
- required: no
- default: empty

### 3. Password
- key: `api_password`
- type: password string
- required: no
- default: empty
- masked while typing: yes

### 4. Save settings button
Behavior:
- validate host
- store settings
- test request if desired
- write diagnostic log entry
- mark device available or unavailable based on result

## 6.2.4 API read behavior
The API driver should use these endpoints internally:

### Get full status
```text
http://<host>/api.html?get=ithostatus
```

### Get current speed
```text
http://<host>/api.html?get=currentspeed
```

### Get remotes info
```text
http://<host>/api.html?get=remotesinfo
```

### Optional auth parameters when set
```text
http://<host>/api.html?username=<username>&password=<password>&get=ithostatus
```

The app should build requests internally. The user should not have to compose URLs.

## 6.2.5 API write behavior
The API driver should use requests such as:

Set preset:
```text
http://<host>/api.html?command=medium
```

Set speed:
```text
http://<host>/api.html?speed=150
```

Set speed with timer:
```text
http://<host>/api.html?speed=150&timer=900
```

Clear queue:
```text
http://<host>/api.html?clearqueue=true
```

Virtual remote command:
```text
http://<host>/api.html?vremotecmd=high
```

Virtual remote command with remote index:
```text
http://<host>/api.html?vremotecmd=high&vremoteindex=1
```

RF remote command:
```text
http://<host>/api.html?rfremotecmd=high
```

All of these should be abstracted behind normal Homey actions.

## 6.2.6 API availability
Device availability should be based on:
- HTTP reachability
- valid response from the add-on
- successful parsing of status endpoints

Preferred behavior:
- polling interval configurable in code, not in user settings
- sensible default poll interval, for example every 15–30 seconds for status
- retry with backoff on failures
- mark device unavailable after repeated failures

---

## 7. Unified capability model

Both devices should expose as close as possible the same Homey capabilities.

## 7.1 Required core capabilities
These are the most important shared capabilities.

| Capability concept | Type | Source |
|---|---|---|
| Online / availability | status | MQTT/API |
| Current fan speed (0–255) | number | MQTT state / API currentspeed |
| Temperature | number | ithostatus |
| Humidity | number | ithostatus |
| CO2 | number if available | ithostatus or remotesinfo if exposed |
| Error code | number | ithostatus |
| Fan speed rpm | number | ithostatus |
| Fan setpoint rpm | number | ithostatus |
| Ventilation setpoint % | number | ithostatus |
| Last command | text or internal token | lastcmd / inferred |

## 7.2 Suggested Homey capabilities
Suggested capability mapping:

- `measure_temperature`
- `measure_humidity`
- `measure_co2` (only if meaningful data is available)
- `dim` or custom numeric capability for speed percentage abstraction
- custom numeric capability for raw speed 0–255
- custom numeric capability for fan rpm
- custom numeric capability for fan setpoint rpm
- custom numeric capability for ventilation setpoint percentage
- alarm or custom capability for fault state
- custom enum capability for preset / mode
- button or action for boost / timer

### Recommended abstraction for speed
Because the Itho device uses raw speed `0–255`, the app should present:

1. **Raw speed**
   - exact protocol value
   - useful for power users and diagnostics

2. **Optional percentage abstraction**
   - derived as `(raw / 255) * 100`
   - useful for end users

If only one is shown in the main device tile, raw speed should remain available through advanced capabilities, tokens, or insights.

## 7.3 Optional capabilities based on data presence
Only expose or use when available:
- highest CO2 concentration
- highest RH concentration
- relative humidity alternative field
- selection
- startup counter
- total operation hours
- absence minutes

These may be better stored as:
- advanced capabilities
- diagnostic view
- device insights
- tags in specific flows

---

## 8. Data mapping rules

The `ithostatus` payload is model/firmware dependent. The app must support missing keys.

### Example available keys from the provided status sample
- `temp`
- `hum`
- `ppmw`
- `Ventilation setpoint (%)`
- `Fan setpoint (rpm)`
- `Fan speed (rpm)`
- `Error`
- `Selection`
- `Startup counter`
- `Total operation (hours)`
- `Absence (min)`
- `Highest CO2 concentration (ppm)`
- `Highest RH concentration (%)`
- `RelativeHumidity`
- `Temperature`

### Recommended normalization
Map synonymous fields carefully:

| Raw field | Normalized field |
|---|---|
| `temp` | `temperature` |
| `Temperature` | `temperature` |
| `hum` | `humidity` |
| `RelativeHumidity` | `humidity` |
| `ppmw` | `co2` or unknown air-quality metric only if confirmed |
| `Fan speed (rpm)` | `fanSpeedRpm` |
| `Fan setpoint (rpm)` | `fanSetpointRpm` |
| `Ventilation setpoint (%)` | `ventilationSetpointPct` |
| `Error` | `errorCode` |
| `Selection` | `selection` |
| `Startup counter` | `startupCounter` |
| `Total operation (hours)` | `totalOperationHours` |
| `Absence (min)` | `absenceMinutes` |

### Special note on `ppmw`
The sample shows `ppmw = 7111`.  
This may represent a value that behaves like an air-quality or concentration reading, but because the meaning is not fully guaranteed from the provided text alone, the blueprint should treat it carefully:
- if documented by implementation as CO2 equivalent → map to CO2
- otherwise keep as advanced raw metric until confirmed

---

## 9. Read/write support matrix

# 9.1 Common commands supported on all Itho devices and add-on versions

| Abstract function | MQTT | API | Notes |
|---|---|---|---|
| Send virtual remote command | Yes | Yes | Requires virtual remote to be configured and joined |
| Select virtual remote by index | Yes | Yes | Optional |
| Select virtual remote by name | Yes | Yes | Optional |
| Clear queue | Yes | No direct API param noted except command support; for API use documented `clearqueue` if supported by implementation logic | Queue behavior is transport-dependent |
| Get full Itho status | Via status topic | Yes | Core read feature |
| Get remotes info | Via remotes topic | Yes | Optional diagnostics |

## 9.2 PWM2I2C protocol devices
Works on at least:
- HRU200
- all CVE models

Known not to support these commands:
- HRU350
- WPU
- DemandFlow / QualityFlow

Supported commands:
- speed
- command
- timer
- get current speed

These commands **cannot be combined with vremote commands in one API call**.

### App behavior
For supported hardware:
- enable speed control actions
- enable timer actions
- enable speed-related conditions/triggers
- read current speed

For unsupported hardware:
- hide or disable unsupported actions where feasible
- show an explanatory message in advanced diagnostics if the command fails

## 9.3 WPU devices
Special commands:
- outside temperature injection
- manual control

These are MQTT-only per the provided text.

### Blueprint recommendation
Do **not** expose these as standard consumer actions in the first version.

Instead:
- reserve for a future advanced device or advanced settings page
- clearly label as “advanced / use with care”
- require confirmation before enabling
- especially avoid exposing `manual control` broadly because the documentation explicitly warns that it can affect operation dangerously

## 9.4 Devices with CC1101 module
Special RF remote commands:
- `rfremotecmd`
- `rfremoteindex`

Supported commands may include:
- away
- low
- medium
- high
- timer1
- timer2
- timer3
- join
- leave
- auto
- autonight
- cook30
- cook60
- motion_on
- motion_off

### App behavior
These should be abstracted under the same user-facing remote-command style actions where possible:
- “Send command”
- “Set preset”
- “Enable motion mode”
- “Disable motion mode”

Only expose when the hardware supports it or when the command succeeds at least once.

## 9.5 Device setting access
Advanced commands:
- `getsetting`
- `setsetting`

### Blueprint recommendation
Because the provided documentation warns that these can change behavior and even make the unit non-working, these should **not** be part of the normal end-user device UI in the first version.

Safer alternatives:
- keep out of scope for v1
- later add to an “Advanced maintenance” feature behind explicit warnings
- no default Flow cards for `setsetting`

---

## 10. Unified Flow design

The request asks for the MQTT and API devices to have as close as possible the same Trigger, Condition, and Action cards, with explanations, tags, and inverted condition cards where possible.

The cards below are the recommended shared design.

# 10.1 Trigger cards

## 1. When the Itho device comes online
**Text:** `The Itho device came online`  
**Applies to:** MQTT + API  
**Explanation:** Triggered when the device becomes reachable again and status updates resume.

### Tokens
- Device name
- Transport (`MQTT` or `API`)

---

## 2. When the Itho device goes offline
**Text:** `The Itho device went offline`  
**Applies to:** MQTT + API  
**Explanation:** Triggered when the device can no longer be reached or is marked offline.

### Tokens
- Device name
- Transport

---

## 3. When the fan speed changes
**Text:** `The fan speed changed`  
**Applies to:** MQTT + API  
**Explanation:** Triggered when the normalized current speed value changes.

### Tokens
- `speed_raw`
- `speed_percent` if implemented
- `previous_speed_raw`

---

## 4. When the fan preset changes
**Text:** `The fan preset changed`  
**Applies to:** MQTT + API  
**Explanation:** Triggered when the detected or commanded preset changes, for example low, medium, or high.

### Tokens
- `preset`
- `previous_preset`

---

## 5. When the temperature changes
**Text:** `The temperature changed`  
**Applies to:** MQTT + API  
**Explanation:** Triggered when the reported temperature value changes.

### Tokens
- `temperature`
- `previous_temperature`

---

## 6. When the humidity changes
**Text:** `The humidity changed`  
**Applies to:** MQTT + API  
**Explanation:** Triggered when the reported humidity value changes.

### Tokens
- `humidity`
- `previous_humidity`

---

## 7. When the CO2 value changes
**Text:** `The CO2 value changed`  
**Applies to:** MQTT + API where available  
**Explanation:** Triggered when a supported concentration metric changes and is mapped as CO2.

### Tokens
- `co2`
- `previous_co2`

---

## 8. When the error state changes
**Text:** `The error state changed`  
**Applies to:** MQTT + API  
**Explanation:** Triggered when the Itho error code changes.

### Tokens
- `error_code`
- `previous_error_code`

---

## 9. When a command was sent successfully
**Text:** `A command was sent successfully`  
**Applies to:** MQTT + API  
**Explanation:** Triggered after the app successfully publishes or sends a control command.

### Tokens
- `command_name`
- `command_value`
- `transport`

---

## 10. When a command failed
**Text:** `A command failed`  
**Applies to:** MQTT + API  
**Explanation:** Triggered when the command could not be sent or the transport returned an error.

### Tokens
- `command_name`
- `command_value`
- `error_message`
- `transport`

---

## 11. When a timer starts
**Text:** `A timer started on the Itho device`  
**Applies to:** MQTT + API where timer commands are supported  
**Explanation:** Triggered when a timer command is sent successfully.

### Tokens
- `timer_seconds`
- `speed_raw` if applicable

---

## 12. When the last command changes
**Text:** `The last received command changed`  
**Applies to:** MQTT directly, API inferred where possible  
**Explanation:** Triggered when the device reports a new last command or the app infers it from a successful API call.

### Tokens
- `last_command`

---

# 10.2 Condition cards

Each condition should ideally exist in normal and inverted form.

## 1. Device is online
**Text:** `The Itho device is online`  
**Inverted text:** `The Itho device is not online`  
**Applies to:** MQTT + API  
**Explanation:** Checks whether the device is currently available.

---

## 2. Fan speed is equal to
**Text:** `The fan speed is [number]`  
**Inverted text:** `The fan speed is not [number]`  
**Applies to:** MQTT + API  
**Explanation:** Checks the current raw speed.

### Argument
- `speed_raw`

---

## 3. Fan speed is above
**Text:** `The fan speed is above [number]`  
**Inverted text:** `The fan speed is not above [number]`  
**Applies to:** MQTT + API

---

## 4. Fan speed is below
**Text:** `The fan speed is below [number]`  
**Inverted text:** `The fan speed is not below [number]`  
**Applies to:** MQTT + API

---

## 5. Fan preset is
**Text:** `The fan preset is [preset]`  
**Inverted text:** `The fan preset is not [preset]`  
**Applies to:** MQTT + API  
**Preset options:**
- away
- low
- medium
- high
- auto
- autonight
- cook30
- cook60
- timer1
- timer2
- timer3
- unknown

Only show options that make sense in the UI and keep advanced values available where appropriate.

---

## 6. Temperature is above
**Text:** `The temperature is above [number] °C`  
**Inverted text:** `The temperature is not above [number] °C`  
**Applies to:** MQTT + API

---

## 7. Temperature is below
**Text:** `The temperature is below [number] °C`  
**Inverted text:** `The temperature is not below [number] °C`  
**Applies to:** MQTT + API

---

## 8. Humidity is above
**Text:** `The humidity is above [number] %`  
**Inverted text:** `The humidity is not above [number] %`  
**Applies to:** MQTT + API

---

## 9. Humidity is below
**Text:** `The humidity is below [number] %`  
**Inverted text:** `The humidity is not below [number] %`  
**Applies to:** MQTT + API

---

## 10. CO2 is above
**Text:** `The CO2 value is above [number] ppm`  
**Inverted text:** `The CO2 value is not above [number] ppm`  
**Applies to:** MQTT + API where available

---

## 11. CO2 is below
**Text:** `The CO2 value is below [number] ppm`  
**Inverted text:** `The CO2 value is not below [number] ppm`  
**Applies to:** MQTT + API where available

---

## 12. The device has an error
**Text:** `The Itho device has an error`  
**Inverted text:** `The Itho device does not have an error`  
**Applies to:** MQTT + API  
**Explanation:** True when error code is not zero or when the device reports a fault state.

---

## 13. Error code is
**Text:** `The error code is [number]`  
**Inverted text:** `The error code is not [number]`  
**Applies to:** MQTT + API

---

# 10.3 Action cards

## 1. Set fan speed
**Text:** `Set the fan speed to [number]`  
**Applies to:** MQTT + API on supported hardware  
**Explanation:** Sets the raw fan speed value in the supported range 0–255.

### Argument
- `speed_raw` (0–255)

### Transport mapping
- MQTT → `{ "speed": value }`
- API → `?speed=value`

---

## 2. Set fan preset
**Text:** `Set the fan preset to [preset]`  
**Applies to:** MQTT + API  
**Explanation:** Sends a preset-like command such as low, medium, or high.

### Preset options
- away
- low
- medium
- high
- auto
- autonight
- cook30
- cook60
- timer1
- timer2
- timer3

### Transport mapping
- MQTT → `{ "command": "medium" }`
- API → `?command=medium`

---

## 3. Start timer
**Text:** `Start a timer for [seconds] seconds`  
**Applies to:** MQTT + API on supported hardware  
**Explanation:** Starts a timed fan action. The exact resulting speed depends on the linked preset or speed.

### Arguments
- `timer_seconds`

### Optional advanced variant
`Set the fan speed to [number] for [seconds] seconds`

Transport mapping:
- MQTT → `{ "speed": value, "timer": seconds }`
- API → `?speed=value&timer=seconds`

---

## 4. Clear queued timers and commands
**Text:** `Clear queued timers and commands`  
**Applies to:** MQTT + API where available  
**Explanation:** Clears queued timers and returns to the fallback/base behavior.

Transport mapping:
- MQTT → `{ "clearqueue": "true" }`
- API → `?clearqueue=true` if supported by the implementation

---

## 5. Send virtual remote command
**Text:** `Send virtual remote command [command]`  
**Applies to:** MQTT + API  
**Explanation:** Emulates a configured virtual remote.

### Optional arguments
- command
- remote index
- remote name

This action may be implemented as:
- simple variant: only command
- advanced variant: command + optional remote selection

---

## 6. Send RF remote command
**Text:** `Send RF remote command [command]`  
**Applies to:** MQTT + API on devices with CC1101 module support  
**Explanation:** Sends an RF-based remote command where supported.

Recommended advanced-only card.

---

## 7. Refresh device state
**Text:** `Refresh the Itho device state`  
**Applies to:** MQTT + API  
**Explanation:** Forces the app to refresh and re-read current state where possible.

Behavior:
- API: issue read requests immediately
- MQTT: refresh internal state from latest retained values or request any supported refresh mechanism if available

---

## 8. Reconnect
**Text:** `Reconnect to the Itho device`  
**Applies to:** MQTT + API  
**Explanation:** Reinitializes the device connection.

Behavior:
- MQTT: reconnect broker client and resubscribe
- API: reset polling state and perform new health check

---

## 9. Retrieve diagnostic log
**Text:** `Retrieve the device diagnostic log`  
**Applies to:** MQTT clearly, API optionally  
**Explanation:** Reloads the visible connection log.

This is optional as a Flow action, but can be useful for diagnostics.

---

## 11. Trigger and token consistency

To keep both devices aligned, token naming should be the same everywhere possible.

### Recommended token names
- `device_name`
- `transport`
- `speed_raw`
- `speed_percent`
- `preset`
- `temperature`
- `humidity`
- `co2`
- `error_code`
- `fan_speed_rpm`
- `fan_setpoint_rpm`
- `ventilation_setpoint_pct`
- `timer_seconds`
- `last_command`
- `online`

---

## 12. Device UI recommendations

# 12.1 Main tile
Recommended tile values:
- primary: online status or preset
- secondary: current fan speed
- tertiary: temperature or humidity

# 12.2 Device view
Suggested sections:
1. **Current status**
   - online/offline
   - current speed
   - preset
   - last command

2. **Sensors**
   - temperature
   - humidity
   - co2 if available

3. **Fan diagnostics**
   - fan speed rpm
   - fan setpoint rpm
   - ventilation setpoint %

4. **System diagnostics**
   - error code
   - startup counter
   - total operation hours
   - absence minutes
   - selection

5. **Advanced diagnostics**
   - raw last status payload
   - last parse time
   - transport
   - hardware support flags

---

## 13. Validation rules

# 13.1 MQTT validation
- broker must not be empty
- port must be 1–65535
- keepalive if provided must be valid integer
- custom client id must be non-empty when enabled
- base topic must be non-empty
- base topic must not contain `#` or `+`
- if LWT enabled:
  - LWT topic required
  - LWT message required

# 13.2 API validation
- host must not be empty
- host may be IP or DNS
- username/password optional
- avoid storing invalid URL prefixes; the app should accept only host/address, not full URL

# 13.3 Command validation
- speed must be 0–255
- timer must be 0–65535
- unsupported commands should fail gracefully
- multiple incompatible commands in one action should be prevented by the UI or logic

---

## 14. Logging blueprint

# 14.1 MQTT device log
The MQTT device must keep a log with timestamped events.

Recommended retention:
- in-memory rolling buffer, for example last 250–1000 lines
- optionally persisted recent history per device

Suggested line format:
```text
YYYY-MM-DD HH:mm:ss [LEVEL] message
```

Examples:
```text
2026-03-23 09:50:01 [INFO] Settings loaded
2026-03-23 09:50:01 [INFO] Connecting to broker mqtt://broker.local:1883
2026-03-23 09:50:02 [INFO] Connected to broker
2026-03-23 09:50:02 [INFO] Subscription added itho/ithostatus
2026-03-23 09:50:02 [INFO] Subscription added itho/state
2026-03-23 09:52:15 [WARN] Malformed payload received on itho/ithostatus
2026-03-23 09:53:02 [INFO] Command publish success command=medium
2026-03-23 09:54:21 [ERROR] Command publish failure reason=connection lost
```

# 14.2 API device diagnostics
The request explicitly mentions log retrieval for MQTT.  
For consistency, the API device should also maintain a lightweight diagnostic log, even if it is not identical in UI prominence.

Suggested entries:
- settings loaded
- request started
- request success
- request timeout
- request parse failure
- device marked unavailable
- command success
- command failure

---

## 15. Suggested internal architecture

## 15.1 Shared service layer
To keep MQTT and API behavior aligned, use a shared abstract service contract.

### Example services
- `IthoDeviceService` — shared normalization and command contract
- `IthoMqttTransport` — MQTT transport implementation
- `IthoApiTransport` — HTTP API transport implementation
- `IthoStateNormalizer` — maps raw payloads to normalized state
- `IthoCommandMapper` — turns Homey actions into transport-specific requests
- `IthoDiagnosticsLogger` — per-device logging
- `IthoCapabilityUpdater` — writes normalized state into Homey capabilities

## 15.2 Shared command contract
Internal actions should look like:
- `setSpeed(value)`
- `setPreset(name)`
- `startTimer(seconds, optionalSpeed)`
- `clearQueue()`
- `sendVirtualRemoteCommand(command, index?, name?)`
- `sendRfRemoteCommand(command, index?)`
- `refreshState()`
- `reconnect()`

The transport implementation decides how to perform them.

---

## 16. Suggested mapping of read/write commands

# 16.1 Shared abstract reads
- get current speed
- get full status
- get remote info
- get last command if available
- get online/offline

# 16.2 Shared abstract writes
- set speed
- set preset
- set timer
- clear queue
- send virtual remote command
- send RF remote command

# 16.3 Advanced writes, excluded from normal v1 UI
- WPU outside temperature injection
- WPU manual control
- getsetting / setsetting

Reason:
- hardware-specific
- risky
- easy to misuse
- not suitable as a general consumer-facing control

---

## 17. Error handling and resilience

### MQTT
- reconnect automatically after disconnect
- exponential backoff recommended
- re-subscribe after reconnect
- validate JSON payloads before parsing
- ignore unsupported or malformed status fields without crashing the device
- log parse errors with topic and reason

### API
- retry polling after timeouts
- distinguish HTTP failure from parse failure
- avoid hammering the endpoint after repeated failures
- preserve last known good state where reasonable
- mark device unavailable only after repeated failures, not on first glitch

---

## 18. Security considerations

### MQTT
- support TLS
- support insecure TLS only as explicit opt-in
- mask password in settings
- avoid logging secrets
- never log password or full authentication strings

### API
- mask password in settings
- never log password
- avoid showing raw URLs with credentials
- prefer building authenticated URLs only in memory

---

## 19. Future extensions

Potential future versions may add:
- discovery of common local Itho hosts
- advanced hardware feature pages
- RF remote device management
- virtual remote management
- expert mode for WPU manual control
- safe advanced settings read-only browser
- optional Homey Energy correlations
- insights charts for operation hours, humidity, and speed

---

## 20. Recommended v1 vs future split

# v1 recommended features
- MQTT device
- API device
- base topic abstraction
- broker log
- status reading
- speed control
- preset control
- timer control
- online/offline handling
- temperature / humidity / error exposure
- unified Flow cards

# future features
- WPU advanced features
- RF device management UI
- getsetting / setsetting UI
- remote-specific capabilities
- richer diagnostics and charts

---

## 21. Acceptance criteria

The blueprint should be considered implemented correctly when:

1. The app has exactly two drivers:
   - `NRG.Watch Itho (MQTT)`
   - `NRG.Watch Itho (API)`

2. The app itself exposes no configuration options.

3. The MQTT device includes all requested MQTT connection settings plus:
   - `MQTT base topic`
   - save settings behavior
   - retrieve log behavior
   - MQTT broker log area
   - LWT help text and fields

4. The API device includes:
   - IP address / DNS
   - optional username
   - optional password

5. The MQTT and API devices expose nearly identical:
   - triggers
   - conditions
   - actions

6. Topic and query abstractions are hidden from the user as much as possible.

7. The implementation tolerates missing status keys and model-specific differences.

8. Unsupported hardware-specific commands fail safely and clearly.

9. Potentially dangerous advanced functions are excluded from the standard user-facing v1 UI.

---

## 22. Minimal driver comparison table

| Aspect | NRG.Watch Itho (MQTT) | NRG.Watch Itho (API) |
|---|---|---|
| Transport | MQTT | HTTP Web API |
| User-configured host | Broker host | Device host |
| Credentials | MQTT username/password | API username/password |
| TLS support | Yes | Not specified in provided text |
| Base topic abstraction | Yes | Not applicable |
| Status updates | Subscribe to topics | Poll endpoints |
| Near real-time changes | Yes | Polling-based |
| Broker log | Yes, required | Optional diagnostic log |
| Flow cards | Shared set | Shared set |
| Internal details hidden | Yes | Yes |

---

## 23. Suggested Homey wording summary

To keep the app consistent, use these user-facing words:

- **Itho device**
- **fan speed**
- **fan preset**
- **timer**
- **temperature**
- **humidity**
- **CO2**
- **error**
- **online**
- **offline**
- **refresh**
- **reconnect**

Avoid low-level wording in the main UI like:
- cmd topic
- lastcmd
- ithostatus
- currentspeed endpoint
- PWM2I2C
- CC1101
- manual operation index

These may appear only in advanced diagnostics or developer logs.

---

## 24. Final recommendation

Build both drivers on top of one shared normalized domain model.  
That is the best way to keep:
- the device experience aligned
- the Flow cards nearly identical
- the implementation maintainable
- protocol differences hidden from the user

This blueprint intentionally keeps dangerous or hardware-specific commands out of the standard v1 end-user experience, while still leaving room to support them later in a clearly labeled advanced mode.

---

## 25. Extra MQTT cards

In case of the 'NRG.Watch Itho (MQTT)' device and as we already built a full MQTT client, I also want to add the following flow cards:

- Trigger cards:
  - MQTT broker connected
  - MQTT broker disconnected
  - Message received on topic {Topic}
    - Triggers when a message is received on the specified MQTT topic. Supports wildcards: + (single level) and # (multi level). When this card triggers, the following tags become available to use: 'Message received': Received message. 'Topic': broker/+/something/#
	- {Topic} is a string
- Condition cards:
  - MQTT broker is connected
    - Should say 'MQTT broker is not connected' if inverted!
- Action cards:
  - Send {Message} on topic {Topic}
    - Publishes a message to the specified MQTT topic with default QoS 0 and no retain.
	- {Message} is a string
	- {Topic} is a string
  - Send {Message} on topic {Topic} with QoS {Quality of Services] and retain {Retain}
    - Publishes a message to the specified MQTT topic with custom QoS and retain settings.
	- {Message} is a string
	- {Topic} is a string
	- {Quality of Services] has the options: 'Qos 0 (At most once)', 'Qos 1 (At least once)' and 'Qos 2 (Exactly once)'
	- {Retain} has options: False and True

# End of blueprint
