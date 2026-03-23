
# Homey App Brief: Insight Devices

## Purpose

Build a Homey app that connects to a single MQTT broker at **app level** and lets the user create multiple MQTT-driven devices at **device level**. The app must support both:

- **predefined device templates** for common use cases
- **a generic custom MQTT device** for flexible advanced use cases

The app is intended for personal use, but the implementation should still be clean, structured, and extensible.

---

## App Identity

- **App name:** `Insight Devices`
- **App id:** `com.brainstoday.insights-devices`
- **App description:** `Create predefined and custom virtual measurement devices in Homey that receive their data via MQTT.`

---

## Product Summary

Insight Devices is a specialized MQTT client for Homey.

### Core concept

- The app maintains **one MQTT broker connection at app level**
- Each device created through the app subscribes to one or more MQTT topics
- Incoming MQTT payloads are parsed and mapped to Homey capabilities
- Some device types also support **derived/calculated values**
- Device values should be visible in Homey and logged to **Insights** where applicable
- Flow cards must be provided for useful automations

### Design goals

- Clean Homey-style UX
- Strong MQTT reliability
- Easy pairing for predefined devices
- Advanced flexibility for custom MQTT devices
- Reusable architecture so new device templates can be added later

---

# Functional Scope

## In scope

- App-level MQTT connection configuration
- Device-level topic configuration
- Subscription management per device
- Parsing of:
  - numeric payloads
  - JSON objects
  - JSON arrays
- Calculated fields for specific device types and the custom device
- Insights logging
- Trigger / Condition / Action flow cards
- Broker status monitoring
- Logging for troubleshooting

## Out of scope for first version

- Multiple MQTT brokers
- MQTT discovery / auto-discovery
- Wildcard-driven auto-generated subdevices
- Full scripting engine for calculations
- Device-to-device dependency chains
- Editing arbitrary capability schemas after device creation in complex ways

---

# Technical Architecture

## App-level responsibility

The app is responsible for:

- storing MQTT broker settings
- managing the MQTT connection lifecycle
- reconnecting when the broker connection is lost
- exposing broker status to devices and flows
- routing incoming MQTT messages to the right device instances
- providing shared logging

## Device-level responsibility

Each device is responsible for:

- storing its own topic settings
- parsing payloads according to its device type
- mapping parsed data to Homey capabilities
- performing device-specific calculations
- triggering relevant flow cards

---

# App-Level Configuration

The app must expose a configuration screen through the app settings / configuration UI.

## Configuration entry point

After installation, the user opens the app and chooses **Configure**.

## Dialog / screen title

- **Title:** `MQTT Client`
- **Sub-title:** `MQTT client settings`

---

## Section: MQTT broker settings

### Introductory help text

Display the following explanatory text as plain help text:

> A broker must be specified for the MQTT client to connect to. The server name can be an IP address or a DNS name. A port number must also be provided. Typically, this is port 1883 for a standard connection and port 8883 for a secure connection.

### Fields

1. **MQTT broker (IP address or DNS)**
   - type: string
   - default: `localhost`

2. **Port number**
   - type: number
   - default: `1883`

3. **Use a secure connection with the broker (TLS)**
   - type: checkbox
   - default: off

4. **Disable certificate validation (when using self-signed certificates)**
   - type: checkbox
   - default: off
   - only relevant when TLS is enabled

5. **Keepalive time (seconds)**
   - type: number
   - default: empty
   - recommended fallback if not provided: `60`

6. **Username**
   - type: string
   - default: empty

7. **Password**
   - type: password string
   - default: empty
   - must be masked while typing

8. **Provide your own client id to be used when connecting to the broker**
   - type: checkbox
   - default: off

9. **Client id**
   - type: string
   - default: empty
   - only enabled when the previous checkbox is enabled

### LWT help text

Display the following explanatory text as plain help text:

> LWT in MQTT stands for Last Will and Testament. It is a core feature of the MQTT protocol designed for IoT and messaging applications to detect when a client disconnects unexpectedly from the MQTT broker.

### LWT fields

10. **Use LWT**
    - type: checkbox
    - default: off

11. **Topic for LWT**
    - type: string
    - default: empty
    - enabled only when `Use LWT` is on

12. **LWT message**
    - type: string
    - default: empty
    - enabled only when `Use LWT` is on

### Action button

- **Save settings**
  - validates input
  - stores settings
  - reconnects the MQTT client if needed
  - writes a log entry for success or failure

---

## Section: MQTT broker log

### UI

- Section title: `MQTT broker log`
- Multiline text field / log area
- Starts empty by default
- Auto-expands vertically as lines are added
- Long lines must not wrap; horizontal scrolling is acceptable

### Button

- **Retrieve log**
  - reloads the in-memory / persisted log into the visible log area

### Logging expectations

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

Each line should preferably include a timestamp.

---

# MQTT Connection Behavior

## Required behavior

- Connect on app startup when valid settings exist
- Reconnect automatically after unexpected disconnect
- Gracefully disconnect and reconnect after settings change
- Subscribe only to topics required by currently paired devices
- Unsubscribe when devices are removed
- Prevent duplicate subscriptions where possible
- Route incoming messages to all interested devices

## Nice to have

- Debounced reconnects
- Connection state caching
- Lightweight diagnostics for last connect error

---

# Device Portfolio

The app must support the following devices:

1. Floor Heating Monitor
2. Ground Level Monitor
3. NRG-Watch Itho CVE
4. Custom MQTT Sensor

Each device must have a clear pairing flow, settings, capabilities, Insights behavior, and flow card support.

---

# Device 1: Floor Heating Monitor

## Description

Monitors underfloor heating performance by tracking **flow temperature** and **return temperature** and calculating **Delta T (Δt)**.

This device provides insight into heating performance and heat transfer efficiency.

## Device type

- **Internal device type / id:** `floor_heating_monitor`

## Device class

- Recommended Homey class: `sensor`

## Pairing / settings

### Required settings

1. **MQTT topic**
   - string
   - required
   - example: `heating/floor1/status`

2. **Payload type**
   - fixed for this device: `json_object`

### Expected payload

The preferred payload is a JSON object.

Example:

```json
{
  "flow": 35.2,
  "return": 29.8
}
```

### Parsing rules

- `flow` = flow temperature in °C
- `return` = return temperature in °C
- `delta` is calculated by the app and is **not read directly**
- if either `flow` or `return` is missing or invalid, `delta` must not be recalculated

### Calculation

```text
delta = flow - return
```

## Capability naming

- `measure_temperature.flow`
- `measure_temperature.return`
- `measure_temperature.delta`

## Capabilities

- Flow Temperature (In)
- Return Temperature (Out)
- Delta T (Δt)

## Insights

All three values must be logged:

- Flow Temperature
- Return Temperature
- Delta T

## Trigger cards

- Flow temperature changed
- Return temperature changed
- Delta T changed

## Condition cards

Use consistent comparison operators:

- `lt` = lower than
- `lte` = lower than or equal
- `gt` = greater than
- `gte` = greater than or equal

Conditions:

- Flow temperature is `[lt | lte | gt | gte]` `[value]`
- Return temperature is `[lt | lte | gt | gte]` `[value]`
- Delta T is `[lt | lte | gt | gte]` `[value]`

## Action cards

- none

## Notes

- Keep payload expectations strict and simple
- This device should prefer object-based payloads over array payloads

---

# Device 2: Ground Level Monitor

## Description

Tracks ground or water level using a direct numeric measurement.

This device is intended for crawl spaces, tanks, or flood-prone areas.

## Device type

- **Internal device type / id:** `ground_level_monitor`

## Device class

- Recommended Homey class: `sensor`

## Pairing / settings

### Required settings

1. **MQTT topic**
   - string
   - required
   - example: `sensor/crawlSpaceHeight`

2. **Unit**
   - default: `cm`

3. **Optional alarm threshold**
   - numeric
   - optional

### Expected payload

The payload is a single numeric value.

Example:

```text
18.4
```

### Parsing rules

- The received value is the measured ground level in cm
- Ignore empty payloads
- Reject invalid numeric payloads with a log entry

## Capability naming

- `measure_level.ground`

## Capabilities

- Ground Level
- Optional alarm threshold
- Optional min/max tracking

## Insights

- Ground level over time

## Trigger cards

- Ground level changed

## Condition cards

- Ground level is `[lt | lte | gt | gte]` `[value]`

## Action cards

- none

## Flow use cases

- Alert when level exceeds a threshold
- Trigger a pump or notification
- Detect a rapid increase that may indicate leakage or flooding

## Notes

- If min/max tracking is implemented, keep it internal or clearly surfaced in advanced UI only
- The primary visible measurement should remain simple

---

# Device 3: NRG-Watch Itho CVE

## Description

Makes a compatible Itho Daalderop CVE smart inside Homey by connecting to the NRG-Watch add-on over MQTT.

This device supports both:

- reading status and sensor values from MQTT
- writing commands back to the device through MQTT

## Device type

- **Internal device type / id:** `nrgwatch_itho_cve`

## Device class

- Recommended Homey class: `fan`

## Device settings

### Required topics

These should be configurable with defaults:

1. **Status topic**
   - default: `itho/ithostatus`

2. **Last command topic**
   - default: `itho/lastcmd`

3. **Remotes info topic**
   - default: `itho/remotesinfo`

4. **LWT topic**
   - default: `itho/LWT`

5. **State topic**
   - default: `itho/state`

6. **Command topic**
   - default: `itho/cmd`

### Optional authentication settings for command publishing

These are only needed if the NRG-Watch setup requires them:

- username
- password

### Optional advanced settings

- publish retained flag: off by default
- command QoS: default 0
- subscribe QoS: default 0

## MQTT integration

### Read topics

- `itho/ithostatus`
- `itho/lastcmd`
- `itho/remotesinfo`
- `itho/LWT`
- `itho/state`

### Write topic

- `itho/cmd`

### Example command payloads

Set virtual remote to high:

```json
{ "vremote": "high" }
```

Set speed to 150 for 15 minutes:

```json
{ "speed": 150, "timer": 15 }
```

Set speed directly:

```json
{ "speed": 120 }
```

## Expected status payloads

### `itho/ithostatus`

Example:

```json
{
  "temp": 22.9,
  "hum": 39.3,
  "ppmw": 6933,
  "Ventilation setpoint (%)": 30,
  "Fan setpoint (rpm)": 920,
  "Fan speed (rpm)": 923,
  "Error": 0,
  "Selection": 7,
  "Startup counter": 699,
  "Total operation (hours)": 27005,
  "Absence (min)": 0,
  "Highest CO2 concentration (ppm)": "not available",
  "Highest RH concentration (%)": 39,
  "RelativeHumidity": 39.26,
  "Temperature": 22.94
}
```

A more advanced status payload may also look like:

```json
{
  "temp": 0,
  "hum": 0,
  "ppmw": 0,
  "ReqFanspeed": 6552.6,
  "Balance": 0,
  "supply_fan_requested": 2205,
  "supply_fan_actual": 2219,
  "exhaust_fan_requested": 1472,
  "exhaust_fan_actual": 1474,
  "supplyTemp": 17.39,
  "exhaustTemp": 14.05,
  "status": 0,
  "RoomTemp": 17.39,
  "OutdoorTemp": 14.05,
  "Valve_position": 0,
  "Bypass_position": 0,
  "Summercounter": 0,
  "Summerday": 0,
  "FrostTimer": 0,
  "BoilTimer": 177,
  "StartCounter": 120,
  "CurPosition": 0,
  "VKKswitch": 0,
  "GroundHeatExchangerSwitch": 0,
  "AirCounter": 2552,
  "Global_fault_code": 0,
  "Actual_Mode": 2,
  "pir_fan_speed_level": 65535,
  "Highest_received_CO2_value": 704,
  "Highest_received_RH_value": 239,
  "Air_Quality": 100,
  "Remaining_override_timer": 0,
  "Fallback_speed_timer": 1714,
  "Exhaust_Constant_Ca0": 2
}
```

### `itho/lastcmd`

Example:

```json
{
  "source": "MQTT API",
  "command": "speed:120",
  "timestamp": 1774182271
}
```

### `itho/state`

Example:

```text
120
```

### `itho/LWT`

Expected values:
- `online`
- `offline`

## Capability naming

Recommended core capability keys:

- `measure_temperature.indoor`
- `measure_humidity.indoor`
- `measure_temperature.supply`
- `measure_temperature.exhaust`
- `measure_air_quality`
- `fan_speed.raw`
- `fan_preset`
- `override_timer.remaining`
- `fault_code`
- `co2_highest`
- `rh_highest`
- `last_command`

## Core capabilities

- Fan Speed
- Fan Preset / Mode
- Humidity
- Temperature
- Supply Temperature
- Exhaust Temperature
- Air Quality
- Remaining Override Timer
- Availability / Online status

## Advanced capabilities

- Requested Fan Speed
- Supply Fan Requested
- Supply Fan Actual
- Exhaust Fan Requested
- Exhaust Fan Actual
- Room Temperature
- Outdoor Temperature
- Highest CO2
- Highest RH
- Actual Mode
- Fallback Speed Timer
- Fault Code

## Insights

Recommended to log:

- Humidity
- Temperature
- Supply Temperature
- Exhaust Temperature
- Air Quality
- Fan Speed
- Remaining Override Timer
- Fault Code
- Highest CO2
- Highest RH

## Trigger cards

- Fan speed changed
- Fan preset changed
- Humidity changed
- Temperature changed
- Supply temperature changed
- Exhaust temperature changed
- Air quality changed
- Override timer changed
- Fault code changed
- Device online status changed
- Last command changed

## Condition cards

- Fan speed is `[lt | lte | gt | gte]` `[value]`
- Humidity is `[lt | lte | gt | gte]` `[value]`
- Temperature is `[lt | lte | gt | gte]` `[value]`
- Supply temperature is `[lt | lte | gt | gte]` `[value]`
- Exhaust temperature is `[lt | lte | gt | gte]` `[value]`
- Air quality is `[lt | lte | gt | gte]` `[value]`
- Fan preset equals `[low | medium | high | timer1 | timer2 | timer3]`
- Override timer active
- Device is online
- Fault code equals `[value]`
- Fault code is not `[value]`

## Action cards

- Set fan speed
- Set fan speed with timer
- Send preset command
- Send virtual remote command
- Clear queue
- Set fallback command

## Suggested command mapping

### Set fan speed
Publishes:

```json
{ "speed": 120 }
```

### Set fan speed with timer
Publishes:

```json
{ "speed": 150, "timer": 15 }
```

### Send preset command
Publishes one of:

```json
{ "command": "low" }
```

```json
{ "command": "medium" }
```

```json
{ "command": "high" }
```

### Send virtual remote command
Publishes one of:

```json
{ "vremote": "low" }
```

```json
{ "vremote": "medium" }
```

```json
{ "vremote": "high" }
```

### Clear queue
Publishes:

```json
{ "clearqueue": true }
```

## Device UI structure

### Primary

- Fan Speed
- Preset
- Humidity
- Temperature
- Air Quality

### Secondary

- Supply Temperature
- Exhaust Temperature
- Override Timer
- Fault Code
- Highest CO2
- Highest RH
- Last Command

## Notes

- Some control behavior depends on Itho unit mode
- RF / virtual remote behavior may be required for full control in some setups
- Treat this device as both a monitor and a controller

---

# Device 4: Custom MQTT Sensor

## Purpose

This is the advanced generic device.

It allows the user to define:

- which MQTT topic to subscribe to
- how the payload should be interpreted
- which values should map to Homey capabilities
- one or more calculated values derived from the incoming payload

This device is intended to avoid needing a new dedicated device template for every custom use case.

## Device type

- **Internal device type / id:** `custom_mqtt_sensor`

## Device class

- Recommended Homey class: `sensor`

## Supported use cases

Examples:

- floor heating values from a custom JSON object
- return / flow / delta-T calculations
- pressure in / pressure out / pressure difference
- liquid level based on a measured distance
- generic humidity or temperature sensors
- custom air quality values

---

## Pairing flow

The pairing flow for this device should be more advanced than for the predefined templates, but still guided.

### Step 1: Basic details

1. **Device name**
2. **MQTT topic**
3. **Optional unit label**
4. **Optional description**

### Step 2: Payload type

The user chooses one of:

- `number`
- `json_object`
- `json_array`

### Step 3: Payload mapping

The user defines one or more source values.

Each source value should support:

- **Source key / path / index**
- **Display label**
- **Capability type**
- **Unit**
- **Enable Insights**
- **Show on device**

### Supported source selectors by payload type

#### When payload type is `number`

- the payload itself is the single source value

#### When payload type is `json_object`

Support JSON path-like dot notation for nested objects.

Examples:

- `flow`
- `return`
- `heating.flow`
- `heating.return`
- `sensors.temp`

#### When payload type is `json_array`

Support zero-based array indexing.

Examples:

- `0`
- `1`
- `2`

---

## Mapping examples

### Example A: JSON object with floor heating values

Incoming payload:

```json
{
  "flowTemp": 32.5,
  "returnTemp": 27.1
}
```

Mappings:

| Source | Label | Capability |
|---|---|---|
| `flowTemp` | Flow Temperature | `measure_temperature.flow` |
| `returnTemp` | Return Temperature | `measure_temperature.return` |

Calculated field:

```text
delta_t = flowTemp - returnTemp
```

### Example B: JSON array

Incoming payload:

```json
[32.5, 27.1]
```

Mappings:

| Source | Label | Capability |
|---|---|---|
| `0` | Flow Temperature | `measure_temperature.flow` |
| `1` | Return Temperature | `measure_temperature.return` |

Calculated field:

```text
delta_t = value0 - value1
```

### Example C: Single numeric value

Incoming payload:

```text
18.4
```

Mapping:

| Source | Label | Capability |
|---|---|---|
| payload | Ground Level | `measure_level.ground` |

---

## Calculation engine

### Goal

Allow user-defined calculated values using mapped fields.

### Required capabilities

Support multiple calculated fields per device.

Each calculated field should define:

1. **Internal key**
2. **Display label**
3. **Formula**
4. **Capability type**
5. **Unit**
6. **Enable Insights**
7. **Show on device**

### Supported operators

- `+`
- `-`
- `*`
- `/`
- parentheses

### Examples

```text
delta_t = flowTemp - returnTemp
```

```text
avg_temp = (flowTemp + returnTemp) / 2
```

```text
water_level = maxHeight - measuredDistance
```

### Calculation constraints

- Formulas may only reference previously defined source values
- Formulas may not reference other calculated values in first version
- No arbitrary JavaScript execution
- Use a safe expression parser
- Invalid formulas must be rejected during setup
- Divide-by-zero and invalid numeric results must be handled safely and logged

### Complexity choice

This app should implement **Option B**:

- JSON path mapping for nested objects
- multiple raw values
- multiple calculated values
- formulas with `+ - * /` and parentheses

Not required in first version:

- functions like `min()`, `max()`, `avg()`
- conditional expressions
- referencing previously calculated outputs
- free-form scripting

---

## Capability model for Custom MQTT Sensor

The custom device should not allow unlimited arbitrary capability generation. It should allow selection from a controlled set of supported capability types.

### Supported capability types

- `measure_temperature`
- `measure_temperature.flow`
- `measure_temperature.return`
- `measure_temperature.delta`
- `measure_humidity`
- `measure_pressure`
- `measure_level`
- `measure_level.ground`
- `measure_air_quality`
- `measure_co2`
- `measure_percentage`
- `measure_power`
- `meter_power`
- `custom_numeric`

### Capability behavior

- For standard supported Homey capabilities, use native behavior where possible
- For custom capability names, keep them consistent and reusable across devices
- Avoid creating one-off capability ids that cannot be reused

---

## Custom MQTT Sensor insights

The user can choose per mapped value and per calculated value whether the value should:

- be logged to Insights
- be visible in the main device view

---

## Trigger cards

At minimum:

- A mapped value changed
- A calculated value changed

Optional richer version:

- Trigger per configured exposed field

Example:

- Flow Temperature changed
- Return Temperature changed
- Delta T changed

---

## Condition cards

The custom device must support comparison conditions for mapped and calculated numeric values:

- value is `[lt | lte | gt | gte]` `[value]`

Optional richer version:

- a separate condition card per configured visible field

---

## Action cards

- none in first version

This is a read-only device type for now.

---

## Validation rules

The custom device pairing flow must validate:

- MQTT topic is not empty
- payload type is chosen
- at least one source mapping exists
- each mapping has a unique internal key
- formulas only reference valid mapped keys
- formulas parse successfully
- chosen capability types are allowed
- duplicate visible labels are discouraged or prevented
- invalid JSON path / array index syntax is rejected

---

## Persistence / edit behavior

Store per custom device:

- topic
- payload type
- source mappings
- calculated fields
- field visibility
- Insights preferences
- units
- labels

If the device settings are edited later:

- resubscribe if the topic changed
- preserve existing capability values where possible
- log changes
- reject edits that would produce an invalid configuration

---

# Global Flow Cards

These app-wide flow cards should exist regardless of device type:

## Triggers

- Broker connection lost
- Broker connection restored

## Conditions

- Broker is connected
- Broker is disconnected

## Optional tokens

Where possible, include useful tokens such as:

- broker host
- timestamp
- last error message

---

# General Standards

## Naming consistency

Use:

- `lt` = lower than
- `lte` = lower than or equal
- `gt` = greater than
- `gte` = greater than or equal

Do not use inconsistent wording such as `lower or equal than` or misspellings such as `greather`.

## Error handling

The app must never crash because of malformed MQTT payloads.

Instead:

- log the parse failure
- ignore the invalid update
- keep the last known valid value

## UX expectations

- Predefined devices should be quick to configure
- The custom device should be powerful but guided
- Keep advanced options hidden unless needed

## Code structure preference

Prefer a structure like:

- shared MQTT service / manager
- reusable payload parsers
- reusable comparison helpers
- reusable flow registration helpers
- one driver / device implementation per device type where sensible

---

# Suggested Implementation Priority

## Phase 1

- App-level MQTT connection
- Floor Heating Monitor
- Ground Level Monitor
- Broker flow cards
- NRG-Watch Itho CVE
- Better diagnostics and command publishing
- Custom MQTT Sensor


## Phase 2

- Mapping engine
- Formula engine

---

# Acceptance Criteria

## App-level

- User can configure MQTT broker settings
- App connects successfully to a broker
- Connection failures are logged
- Reconnect works automatically

## Device-level

- User can pair each device type
- Devices subscribe to configured topics
- Valid MQTT messages update Homey capabilities
- Invalid messages do not crash the app
- Insights are populated for configured measurements

## Flow-level

- Trigger cards fire when expected
- Condition cards evaluate correctly using `lt`, `lte`, `gt`, `gte`
- NRG-Watch actions publish correct MQTT payloads
- Broker connection flow cards work

## Custom device

- User can map JSON object fields using dot notation
- User can map JSON array values using indexes
- User can define multiple calculated values
- Supported formulas work correctly
- Invalid formulas are rejected during setup

---

# Context / Reference Notes

## NRG-Watch / Itho references

- https://www.nrgwatch.nl/
- https://www.nrgwatch.nl/support-ondersteuning/
- https://github.com/arjenhiemstra/ithowifi/wiki

## Example topics observed in practice

### `itho/LWT`

```text
online
```

### `itho/ithostatus`

```json
{"temp":22.9,"hum":39.3,"ppmw":6933,"Ventilation setpoint (%)":30,"Fan setpoint (rpm)":920,"Fan speed (rpm)":923,"Error":0,"Selection":7,"Startup counter":699,"Total operation (hours)":27005,"Absence (min)":0,"Highest CO2 concentration (ppm)":"not available","Highest RH concentration (%)":39,"RelativeHumidity":39.26,"Temperature":22.94}
```

### `itho/remotesinfo`

```json
{}
```

### `itho/lastcmd`

```json
{"source":"MQTT API","command":"speed:120","timestamp":1774182271}
```

### `itho/state`

```text
120
```

### `itho/cmd`

Used to push commands, for example:

```json
{"speed":120}
```
