I want you to create the Homey app with the app name: "Insights Devices" and app ID: "com.brainstoday.insights-devices".
The description is: "Create pre-deficed custom virtual measurement devices in Homey which are receiving their data via MQTT.".

Please check /context folder for context, analyze carefully:

- /context/homey-insights-devices-blueprint.md : contains the base requirements for the app/
- /context/homey_sdk_condition_card_inversion.md : contains background information about inverted cards and how card titles can be changed in inverted state
- /context/README.md : contains an example of a README.md file intended to be used as inspiration for the README.md file for this app
- /context/README.txt : contains an example of a README.txt file intended to be used as inspiration for the README.md file for this app

Furthermore there are assests which can be used:

/context/assets/app/icon.svg : SVG files to be used for the app but in case something is missing, feel free to add one yourself
/context/assets/app/icons/ : contains SVG files which can be used for capabilities
/context/assets/app/images/ : contains PNG files which can be used for the app
/context/assets/devices/ : Contains subfolders for the various devices, each having child folders for icons/ in which SVG files are available to be used for the device, and a folder for images/ containing PNG files which can be used for the device.

- Check all SVG files against these guidelines and make fixes if required: https://apps.developer.homey.app/app-store/guidelines#1-5-icons if no SVG is available then find yourself a SVG file which matches the intent and guiedlines.
- Please make sure that everything is localized and supporting EN and NL, so /locales/ folder needs to be used, site texts needs to be translated into EN and NL, README.txt.nl needs to be available.
- In app.json make sure to include the following section so that the references to GitHub will be shown in the Homey App store:

```json
  "author": {
    "name": "Robert Coemans",
    "email": "r.coemans@hotmail.com"
  },
  "homepage": "https://github.com/rcoemans/com.brainstoday.insights-devices",
  "support": "https://github.com/rcoemans/com.brainstoday.insights-devices/issues",
  "source": "https://github.com/rcoemans/com.brainstoday.insights-devices",
  "bugs": {
    "url": "https://github.com/rcoemans/com.brainstoday.insights-devices/issues"
  },
```

- Once done update README.md , README.txt and README.nl.txt files.



---



### Set default settings

``` bash
git config --global user.name "Robert Coemans"
git config --global user.email "r.coemans@hotmail.com"
```

### Initial commit

``` bash
git init
git add .
git commit -m "Inital version of com.brainstoday.insights-devices app"
git branch -M main
git remote add origin https://github.com/rcoemans/com.brainstoday.insights-devices.git
git push -u origin main
```

### Follow up commits

``` bash
git add -A
git commit -m "..."
git push
```




---





Still same issue:

When in app settings > 'Configure' and I try to Save settings, I am getting the error: 'Error: Not found: POST /api/app/com.brainstoday.insights-devices/reconnect'

Also when just below I 'click' the 'Retrieve log' button, I am getting the error: 'Error retrieving log: Not found: GET /api/app/com.brainstoday.insights-devices.log'


---


When trying to add 'Ground Level Monitor' it shows the error: 'my.homey.app meldt het volgende' and then 'Error: Could not load script: /js/homey.pairing.js'

When I click 'OK' it shows errors like: 'Could not find that pair session'.


---


I tested:

- 'Ground Level Monitor':
  - Works okay but would like to see the ground level on the device card (status indicator) if possible, perhaps it is not possible in case it is a custom capability, in that case let me know.


- 'NRG-Watch Itho CVE':
  - Works okay but would like to see the value from the topic 'state' as well, this is the fan rpm but the in a scale between 0 (off) and 255 (max). I want to see this value (speed) on the device card (status indicator) if possible, perhaps it is not possible in case it is a custom capability, in that case let me know, but also in the device capabilities overview.
- In the device capabilities overview I see 'Supply Temperature' and 'Exhaust Temperature' which I do not recognize, maybe this is because my Itho Daalderop CVE is not having those capabilities in that case leave as is.
- I also see other elements in the 'ithostatus' topic (see json below), can you check if there is anything which could be handy to add?

```json
{"temp":22.9,"hum":39.3,"ppmw":6933,"Ventilation setpoint (%)":30,"Fan setpoint (rpm)":920,"Fan speed (rpm)":923,"Error":0,"Selection":7,"Startup counter":699,"Total operation (hours)":27005,"Absence (min)":0,"Highest CO2 concentration (ppm)":"not available","Highest RH concentration (%)":39,"RelativeHumidity":39.26,"Temperature":22.94}
```

- 'Custom MQTT Sensor':
  - At first glance it looked it worked but I can't do anything else as give a MQTT topic and select the payload type, I cannot configure a capability, make a mapping, set a custom calculation etc.


---


'NRG-Watch Itho CVE':
 - For device options: Low, Medium, High, can you adjust this so that the current state is reflected? Currently it does not update when the speed changes. Low = 20, Medium = 120, High = 220. In case there is another speed then none should be highlighted.

'Custom MQTT Sensor':
- I now see text boxes for 'Source Mappings (JSON)' and 'Calculated Fields', but it is totally unclear how it works, how to map to a capability, which capabilities I can choose from, how I can create a custom calculation, how I can map this custom calculation to a capability etc.
- Can you provide examples for:
  - MQTT Topic = sensor/crawlSpaceHeight, just a single key, represents CM, is ground level.
  - MQTT Topic = itho/lastcmd, it's a JSON object: {"source":"MQTT API","command":"speed:120","timestamp":1774182271}, I want to show the command and timestamp.


---


- 'Ground Level Monitor':
  - To the informational message for MQTT Topic add the expected format, so it is clear to consumers what needs to be send to the topic.

'Floor Heating Monitor'
  - To the informational message for MQTT Topic add the expected JSON format, so it is clear to consumers what needs to be send to the topic.

Add instructions how to use all four devices to README.md, README.txt and README.nl.txt files


---


'Custom MQTT Sensor':
  - We are very close. I have added payload type = Single Number, then added display name and unit for Number Value 1, also I added a Calculated Value 1: Formula = n1 * 10 , Display name and unit is given.
  - Issues: the Number Value 1 is not shown as device capabilities, the Calculate Value is but the title is 'Calculate Value 1' and not the title I gave.
  - Same issues for Insights 


---


'Custom MQTT Sensor':
  -  I have added payload type = Single Number, then added display name and unit for Number Value 1 and it did not show, then I added a value in JSON Path field, what according to the help text is not needed for Single Number but now it works, so either fix the bug or change the help text JSON Path.