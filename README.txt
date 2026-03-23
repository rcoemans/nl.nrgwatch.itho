NRG.Watch Itho add-on for Homey.

Control and monitor your Itho ventilation system via MQTT or API in Homey (requires the NRG.Watch Itho add-on).

Features:
- Two connection methods: MQTT (real-time) and HTTP API (polling)
- Real-time sensor data: temperature, humidity, fan speed (RPM and raw 0-255)
- Fan control: presets (away, low, medium, high, auto, timers), raw speed control
- Ventilation metrics: fan setpoint, ventilation setpoint percentage
- Error monitoring: error code tracking with change triggers
- Diagnostic data: total operation hours, startup counter
- 12 flow trigger cards: device online/offline, speed/preset/temperature/humidity/error changes, command success/failure, MQTT broker connection events, MQTT message received (with wildcard support)
- 11 flow condition cards with inversion support (is/is not): device online, speed comparisons (equal/above/below), preset matching, temperature/humidity thresholds, error state, MQTT broker connected
- 8 flow action cards: set speed (raw or with timer), set preset, start timer, clear queue, send virtual remote command, MQTT publish (simple and advanced with QoS/retain)
- MQTT base topic abstraction: configure one base topic, all subtopics derived automatically (state, ithostatus, lastcmd, lwt, cmd)
- MQTT features: TLS support, authentication, custom client ID, Last Will and Testament (LWT), connection logging
- API features: configurable poll interval, authentication support
- Fully localized in English and Dutch (Nederlands)

Supported devices:
- Itho ventilation systems with NRG.Watch Itho add-on (MQTT or API connection)

Setup:
1. Install the app on your Homey
2. Add a new device: NRG.Watch Itho add-on > NRG.Watch Itho (MQTT) or NRG.Watch Itho (API)
3. For MQTT: Configure broker address, port, credentials, and base topic (default: itho)
4. For API: Configure IP address, optional credentials, and poll interval (default: 15 seconds)
5. Save settings and the device will connect automatically
6. Connection settings can be changed later in device Settings

Connection methods:
- MQTT: Real-time updates via MQTT broker, supports TLS, authentication, LWT
- API: Polling-based updates via HTTP API, configurable interval

Known limitations:
- Local network access required for both MQTT and API
- API uses HTTP only (no HTTPS) - use on trusted networks
- Some commands only work on specific Itho models (PWM2I2C protocol for HRU200/CVE models, CC1101 module for RF commands)
- MQTT provides instant updates; API polls at configured intervals
- Hardware-specific features may not be available on all Itho models
