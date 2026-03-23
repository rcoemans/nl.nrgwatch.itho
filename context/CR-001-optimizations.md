---
id: CR-001
type: change-request
status: new
date: 2026-03-18
source: user input
---

# CR-001: Optimizations

## changes

- Add functionality on App level (settings) to retrieve the logs for both, the API device as well as the MQTT device.

- On device settings for both, API as well MQTT device I see: 'Away', 'Low', 'Medium', 'High', 'Auto', 'Auto Night', 'Cook 30', 'Cook 60', 'Timer 1', 'Timer 2' and 'Timer 3'. I was expecting: 'Low', 'Medium', 'High', 'Timer 1', 'Timer 2' and 'Timer 3' only, are: 'Away', 'Auto', 'Auto Night', 'Cook 30' and 'Cook 60' perhaps for other types of NRG.Watch add-ons? Please check /context/homey-nrg-watch-itho-add-on-blueprint.md for this. If this is the case, I would like to have an option (dropdown) in both devices (API and MQTT) to select default or a specific add-on device and add elements belonging this this specifc device.

- On device settings I see the capabilities: 'Startup Counter', 'Total Operation Hours', 'Error Code', 'Ventilation Setpoint', 'Fan Setpoint', 'Fan Speed', 'Humidity', 'Temperature' and 'Fan Speed (Raw)', I want the following changes, check if they can be done for both: API and MQTT, if not, add these capabilities for the device where it is possible:
  1. 'Fan Speed (Raw)' needs to be renamed into 'Speed State (0-255)' and the icon needs to be an icon indicating rpm
  2. 'Fan Speed' the icon needs to be an icon indicating rpm
  3. 'Ventilation Setpoint' the icon needs to be an icon indicating rpm
  4. 'Fan Setpoint' the icon needs to be an icon indicating rpm
  5. 'Temperature' needs to be renamed into 'Indoor Temperature'
  6. 'Humidity' no changes required
  7. 'Absolute Humidity' needs to be added, same icon as used for 'Humidity'
  8. 'Supply Temperature' needs to be added, same icon as used for 'Temperature'
  9. 'Exhaust Temperature' needs to be added, same icon as used for 'Temperature'
  10. 'Error Code' the icon needs to be an icon showing an alarm (triangle with an esclamation mark)
  11. 'Total Opearation Hours' the icon needs to be a graph/bar icon which is going up
  12. 'Startup Counter' the icon needs to be a counter like icon
  13. 'Online' needs to be added, the icon needs to be a on/off icon

- For both: API and MQTT device, the default 'Status Indicator' should be 'None'

- For both: API and MQTT device, the 'Status Indicator' 'Fan Speed (Raw)' needs to be added

## Tasks

- Apply the changes
- Update the README documents:
  - /README.md
  - /README.txt
  - /README.nl.txt
