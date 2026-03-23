NRG.Watch Itho add-on voor Homey.

Bedien en monitor je Itho ventilatiesysteem via MQTT of API in Homey (vereist de NRG.Watch Itho add-on).

Functies:
- Twee verbindingsmethoden: MQTT (realtime) en HTTP API (polling)
- Realtime sensorgegevens: temperatuur, luchtvochtigheid, ventilatorsnelheid (RPM en raw 0-255)
- Ventilatorbesturing: presets (afwezig, laag, middel, hoog, auto, timers), ruwe snelheidsregeling
- Ventilatiemetingen: ventilator setpoint, ventilatie setpoint percentage
- Foutbewaking: foutcode tracking met wijzigingstriggers
- Diagnostische gegevens: totaal aantal bedrijfsuren, opstart teller
- 12 flow trigger kaarten: apparaat online/offline, snelheid/preset/temperatuur/luchtvochtigheid/fout wijzigingen, commando succes/falen, MQTT broker verbindingsgebeurtenissen, MQTT bericht ontvangen (met wildcard ondersteuning)
- 11 flow conditie kaarten met inversie ondersteuning (is/is niet): apparaat online, snelheidsvergelijkingen (gelijk/boven/onder), preset matching, temperatuur/luchtvochtigheid drempels, foutstatus, MQTT broker verbonden
- 8 flow actie kaarten: stel snelheid in (raw of met timer), stel preset in, start timer, wis wachtrij, stuur virtuele afstandsbediening commando, MQTT publiceren (eenvoudig en geavanceerd met QoS/retain)
- MQTT basis topic abstractie: configureer één basis topic, alle subtopics worden automatisch afgeleid (state, ithostatus, lastcmd, lwt, cmd)
- MQTT functies: TLS ondersteuning, authenticatie, aangepaste client ID, Last Will and Testament (LWT), verbindingslogboek
- API functies: configureerbaar poll interval, authenticatie ondersteuning
- Volledig gelokaliseerd in Engels en Nederlands

Ondersteunde apparaten:
- Itho ventilatiesystemen met NRG.Watch Itho add-on (MQTT of API verbinding)

Installatie:
1. Installeer de app op je Homey
2. Voeg een nieuw apparaat toe: NRG.Watch Itho add-on > NRG.Watch Itho (MQTT) of NRG.Watch Itho (API)
3. Voor MQTT: Configureer broker adres, poort, inloggegevens en basis topic (standaard: itho)
4. Voor API: Configureer IP-adres, optionele inloggegevens en poll interval (standaard: 15 seconden)
5. Sla instellingen op en het apparaat maakt automatisch verbinding
6. Verbindingsinstellingen kunnen later worden gewijzigd in apparaat Instellingen

Verbindingsmethoden:
- MQTT: Realtime updates via MQTT broker, ondersteunt TLS, authenticatie, LWT
- API: Polling-gebaseerde updates via HTTP API, configureerbaar interval

Bekende beperkingen:
- Lokale netwerktoegang vereist voor zowel MQTT als API
- API gebruikt alleen HTTP (geen HTTPS) - gebruik op vertrouwde netwerken
- Sommige commando's werken alleen op specifieke Itho modellen (PWM2I2C protocol voor HRU200/CVE modellen, CC1101 module voor RF commando's)
- MQTT biedt directe updates; API pollt met geconfigureerde intervallen
- Hardware-specifieke functies zijn mogelijk niet beschikbaar op alle Itho modellen
