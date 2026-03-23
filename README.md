# NRG.Watch Itho add-on

[![Homey App](https://img.shields.io/badge/Homey-App%20Store-00A94F?logo=homey)](https://homey.app/)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)

Homey app for **Itho ventilation systems** via the **NRG.Watch Itho add-on**. Control and monitor your Itho ventilation through **MQTT** or **HTTP API** directly from Homey.

## Disclaimer

> **This is an unofficial, community-developed integration.**
>
> - Not affiliated with, endorsed by, or supported by **Itho** or **NRG.Watch**.
> - The NRG.Watch Itho add-on may change or discontinue these interfaces at any time without notice — app functionality may break as a result.
> - Use at your own risk. The developers accept no liability for incorrect readings or unintended ventilation control changes.

## Supported Devices

This app supports Itho ventilation systems through the NRG.Watch Itho add-on with two connection methods:

| Connection Type | Description | Real-time Updates |
|----------------|-------------|-------------------|
| **MQTT** | Connect via MQTT broker | ✅ Yes (event-driven) |
| **HTTP API** | Connect via Web API | ⏱️ Polling-based |

## Requirements

- Itho ventilation system with **NRG.Watch Itho add-on** installed
- For MQTT: Access to an **MQTT broker** (can be the same device running the add-on)
- For API: Network access to the add-on's **HTTP API endpoint**
- Homey Pro (2016-2019, 2023) or Homey Cloud

## Installation

### Via Homey App Store

Search for **"NRG.Watch Itho add-on"** in the Homey App Store.

### Via CLI (sideloading / development)

```bash
npm install -g homey
git clone https://github.com/rcoemans/nl.nrgwatch.itho
cd nl.nrgwatch.itho
npm install
homey login
homey app install
```

## Setup

### Adding an MQTT Device

1. Install the app on your Homey
2. Add a new device: **NRG.Watch Itho add-on → NRG.Watch Itho (MQTT)**
3. Configure MQTT connection settings:
   - **Broker**: IP address or DNS name of your MQTT broker
   - **Port**: Default 1883 (or 8883 for TLS)
   - **Username/Password**: If required by your broker
   - **Base Topic**: Default `itho` (the app automatically derives all subtopics)
4. Optionally configure TLS and Last Will and Testament (LWT)
5. Save settings and the device will connect automatically

### Adding an API Device

1. Install the app on your Homey
2. Add a new device: **NRG.Watch Itho add-on → NRG.Watch Itho (API)**
3. Configure API connection settings:
   - **IP address or DNS**: Address of the NRG.Watch Itho add-on
   - **Username/Password**: If required by the add-on
   - **Poll interval**: How often to poll for updates (default 15 seconds)
4. Save settings and the device will start polling automatically

## Device Capabilities

Both MQTT and API devices expose the same capabilities:

| Capability | Description | Read/Write |
|-----------|-------------|------------|
| Fan Preset | Current fan preset (away, low, medium, high, auto, etc.) | Read + Write |
| Fan Speed (Raw) | Raw fan speed value (0-255) | Read only |
| Temperature | Indoor temperature | Read only |
| Humidity | Indoor humidity | Read only |
| Fan Speed (RPM) | Current fan speed in RPM | Read only |
| Fan Setpoint (RPM) | Target fan speed in RPM | Read only |
| Ventilation Setpoint | Ventilation setpoint percentage | Read only |
| Error Code | Current error code (0 = no error) | Read only |
| Total Operation Hours | Cumulative operation hours | Read only |
| Startup Counter | Number of startups | Read only |

## Flow Cards

### Triggers (WHEN…)

| Trigger | Description |
|---------|-------------|
| The Itho device came online | Fires when the device becomes reachable |
| The Itho device went offline | Fires when the device becomes unreachable |
| The fan speed changed | Fires when the fan speed changes |
| The fan preset changed | Fires when the preset changes |
| The temperature changed | Fires when temperature changes |
| The humidity changed | Fires when humidity changes |
| The error state changed | Fires when the error code changes |
| A command was sent successfully | Fires after successful command execution |
| A command failed | Fires when a command fails |
| **MQTT only:** MQTT broker connected | Fires when MQTT broker connects |
| **MQTT only:** MQTT broker disconnected | Fires when MQTT broker disconnects |
| **MQTT only:** Message received on topic | Fires when a message is received on specified topic (supports wildcards) |

### Conditions (AND…)

All condition cards support **inversion** (is/is not):

| Condition | Description |
|-----------|-------------|
| The Itho device !{{is\|is not}} online | Checks if device is available |
| The fan speed !{{is\|is not}} [[speed]] | Checks if fan speed equals value |
| The fan speed !{{is\|is not}} above [[speed]] | Checks if fan speed is above value |
| The fan speed !{{is\|is not}} below [[speed]] | Checks if fan speed is below value |
| The fan preset !{{is\|is not}} [[preset]] | Checks if preset matches |
| The temperature !{{is\|is not}} above [[temperature]] °C | Checks temperature threshold |
| The temperature !{{is\|is not}} below [[temperature]] °C | Checks temperature threshold |
| The humidity !{{is\|is not}} above [[humidity]] % | Checks humidity threshold |
| The humidity !{{is\|is not}} below [[humidity]] % | Checks humidity threshold |
| The Itho device !{{has\|does not have}} an error | Checks for error state |
| **MQTT only:** MQTT broker !{{is\|is not}} connected | Checks MQTT connection status |

### Actions (THEN…)

| Action | Description |
|--------|-------------|
| Set the fan speed to [[speed]] | Sets raw fan speed (0-255) |
| Set the fan preset to [[preset]] | Sets fan preset (away, low, medium, high, etc.) |
| Start a timer for [[seconds]] seconds | Starts a timer |
| Set the fan speed to [[speed]] for [[seconds]] seconds | Sets speed with timer |
| Clear queued timers and commands | Clears the command queue |
| Send virtual remote command [[command]] | Emulates a virtual remote |
| **MQTT only:** Send [[message]] on topic [[topic]] | Publishes MQTT message (QoS 0) |
| **MQTT only:** Send [[message]] on topic [[topic]] with QoS [[qos]] and retain [[retain]] | Publishes MQTT message with custom settings |

## MQTT Topics

The MQTT device automatically derives all topics from the configured **base topic**:

| Purpose | Derived Topic | Direction |
|---------|---------------|-----------|
| Status updates | `<base>/ithostatus` | Subscribe |
| Current speed | `<base>/state` | Subscribe |
| Last command | `<base>/lastcmd` | Subscribe |
| Last Will | `<base>/lwt` | Subscribe |
| Commands | `<base>/cmd` | Publish |

**Example:** With base topic `itho`, the app subscribes to `itho/ithostatus`, `itho/state`, etc.

## API Endpoints

The API device uses these endpoints internally:

| Purpose | Endpoint |
|---------|----------|
| Full status | `/api.html?get=ithostatus` |
| Current speed | `/api.html?get=currentspeed` |
| Send command | `/api.html?command=<preset>` |
| Set speed | `/api.html?speed=<value>` |
| Set timer | `/api.html?timer=<seconds>` |

Authentication parameters are added automatically if configured.

## Use Case Examples

### Automatic ventilation based on humidity

```
WHEN humidity changed
AND humidity is above 70%
THEN set the fan preset to high
```

### Return to low speed after timer

```
WHEN the fan preset changed to timer1
THEN wait 10 minutes
AND set the fan preset to low
```

### Error notifications

```
WHEN the error state changed
AND the Itho device has an error
THEN send push notification: "Itho error: {{error_code}}"
```

### MQTT automation

```
WHEN message received on topic "home/bathroom/humidity"
AND humidity is above 75
THEN set the fan preset to high
```

## Device Settings

### MQTT Device Settings

| Setting | Default | Description |
|---------|---------|-------------|
| MQTT broker | localhost | IP address or DNS name of MQTT broker |
| Port | 1883 | MQTT broker port |
| Use TLS | Off | Enable secure connection |
| Disable cert validation | Off | Allow self-signed certificates |
| Keepalive | 60 | MQTT keepalive interval (seconds) |
| Username | - | MQTT authentication username |
| Password | - | MQTT authentication password |
| Custom client ID | Off | Use custom client ID |
| Base topic | itho | Base MQTT topic (all subtopics derived automatically) |
| Use LWT | Off | Publish Last Will and Testament |

### API Device Settings

| Setting | Default | Description |
|---------|---------|-------------|
| IP address or DNS | - | Address of NRG.Watch Itho add-on |
| Username | - | API authentication username |
| Password | - | API authentication password |
| Poll interval | 15 | Polling interval in seconds |

## Known Limitations

| Limitation | Description |
|-----------|-------------|
| **Local network only** | Both MQTT and API require local network access |
| **No auto-discovery** | Manual configuration required |
| **Hardware-specific features** | Some commands only work on specific Itho models |
| **MQTT real-time vs API polling** | MQTT provides instant updates; API polls at intervals |

## Supported Itho Commands

### Common Commands (all models)

- Virtual remote commands (away, low, medium, high, timer1-3)
- Clear queue
- Get status

### PWM2I2C Protocol Devices (HRU200, CVE models)

- Set speed (0-255)
- Set timer
- Speed + timer combination

### Devices with CC1101 Module

- RF remote commands
- Additional presets (auto, autonight, cook30, cook60, motion)

## Security Considerations

- **MQTT**: Supports TLS encryption and authentication
- **API**: HTTP only (no HTTPS) - use on trusted networks
- **Credentials**: Stored securely in Homey's encrypted settings
- **Local only**: No cloud or internet connections

## Terminology

| Term | Meaning |
|------|---------|
| **Preset** | Predefined fan speed setting (away, low, medium, high, etc.) |
| **Raw speed** | Direct speed value (0-255) sent to the ventilation unit |
| **Base topic** | Root MQTT topic from which all subtopics are derived |
| **LWT** | Last Will and Testament - MQTT feature for detecting disconnections |
| **Virtual remote** | Software emulation of physical Itho remote control |

## Technical Details

- **Protocol**: MQTT v3.1.1 / HTTP 1.1
- **SDK**: Homey Apps SDK v3
- **Languages**: English (en), Nederlands (nl)
- **Transport abstraction**: Unified device model for MQTT and API

## Troubleshooting

### MQTT device shows offline

1. Check MQTT broker is running and accessible
2. Verify broker address and port in device settings
3. Check username/password if authentication is enabled
4. Review MQTT broker log in device settings

### API device shows unavailable

1. Verify IP address of NRG.Watch Itho add-on
2. Check network connectivity from Homey to add-on
3. Verify username/password if required
4. Try reducing poll interval

### Commands not working

1. Verify your Itho model supports the command
2. Check device is online
3. Review flow card logs for error messages
4. For MQTT: check MQTT broker log

## Credits & Acknowledgements

This Homey app was created by **Robert Coemans** with assistance from **Claude** (Anthropic), built using **[Windsurf](https://windsurf.com)** — an AI-powered IDE for collaborative software development.

If you like this, consider [buying me a coffee](https://buymeacoffee.com/kabxpqqg7z).

Pull requests and issue reports are welcome on [GitHub](https://github.com/rcoemans/nl.nrgwatch.itho/issues).

## License

GPL-3.0 - see [LICENSE](LICENSE) file for details.
