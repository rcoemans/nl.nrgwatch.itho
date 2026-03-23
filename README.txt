NRG.Watch Itho add-on for Homey.

Control and monitor your Itho ventilation system via MQTT or API in Homey (requires the NRG.Watch Itho add-on).

Features:
- Two connection methods: MQTT (real-time) and HTTP API (polling)
- Device type selection: Default (HRU200/CVE) or CC1101 RF module, determines available fan presets
- Real-time sensor data: indoor temperature, humidity, absolute humidity, supply/exhaust temperature, fan speed (RPM and 0-255)
- Fan control: presets (low, medium, high, timers; extended presets with CC1101), raw speed control
- Ventilation metrics: fan setpoint, ventilation setpoint percentage
- Online status indicator
- Error monitoring: error code tracking with alarm icon and change triggers
- Diagnostic data: total operation hours (graph icon), startup counter (counter icon)
- App-level settings page with centralized log viewer for both MQTT and API devices
- 12 flow trigger cards: device online/offline, speed/preset/temperature/humidity/error changes, command success/failure, MQTT broker connection events, MQTT message received (with wildcard support)
- 11 flow condition cards with inversion support (is/is not): device online, speed comparisons (equal/above/below), preset matching, temperature/humidity thresholds, error state, MQTT broker connected
- 8 flow action cards: set speed (raw or with timer), set preset, start timer, clear queue, send virtual remote command, MQTT publish (simple and advanced with QoS/retain)
- MQTT base topic abstraction: configure one base topic, all subtopics derived automatically (state, ithostatus, lastcmd, lwt, cmd)
- MQTT features: TLS support, authentication, custom client ID, Last Will and Testament (LWT), connection logging
- API features: configurable poll interval, authentication support
- Dedicated capability icons: speedometer (RPM fields), alarm triangle (error), bar chart (operation hours), counter (startups), on/off (online), thermometer (temperatures), water drop (humidity)
- Fully localized in English and Dutch (Nederlands)

Supported devices:
- Itho ventilation systems with NRG.Watch Itho add-on (MQTT or API connection)

Setup:
1. Install the app on your Homey
2. Add a new device: NRG.Watch Itho add-on > NRG.Watch Itho (MQTT) or NRG.Watch Itho (API)
3. Select your Itho device type (Default or CC1101 RF module)
4. For MQTT: Configure broker address, port, credentials, and base topic (default: itho)
5. For API: Configure IP address, optional credentials, and poll interval (default: 15 seconds)
6. Save settings and the device will connect automatically
7. View logs in the App Settings page for troubleshooting

Connection methods:
- MQTT: Real-time updates via MQTT broker, supports TLS, authentication, LWT
- API: Polling-based updates via HTTP API, configurable interval

Known limitations:
- Local network access required for both MQTT and API
- API uses HTTP only (no HTTPS) - use on trusted networks
- Some commands only work on specific Itho models (PWM2I2C protocol for HRU200/CVE models, CC1101 module for RF commands)
- MQTT provides instant updates; API polls at configured intervals
- Hardware-specific features may not be available on all Itho models
- Supply/exhaust temperature and absolute humidity only shown when reported by the device
