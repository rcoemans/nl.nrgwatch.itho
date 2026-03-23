NRG.Watch Itho add-on voor Homey.

Bedien en monitor je Itho ventilatiesysteem via MQTT of API in Homey (vereist de NRG.Watch Itho add-on).

Functies:
- Twee verbindingsmethoden: MQTT (realtime) en HTTP API (polling)
- Apparaattype selectie: Standaard (HRU200/CVE) of CC1101 RF module, bepaalt beschikbare ventilator presets
- Realtime sensorgegevens: binnentemperatuur, luchtvochtigheid, absolute luchtvochtigheid, aanvoer-/afvoertemperatuur, ventilatorsnelheid (RPM en 0-255)
- Ventilatorbesturing: presets (laag, middel, hoog, timers; uitgebreide presets met CC1101), ruwe snelheidsregeling
- Ventilatiemetingen: ventilator setpoint, ventilatie setpoint percentage
- Online status indicator
- Foutbewaking: foutcode tracking met alarm icoon en wijzigingstriggers
- Diagnostische gegevens: totaal aantal bedrijfsuren (grafiek icoon), opstart teller (teller icoon)
- App-niveau instellingenpagina met gecentraliseerde logviewer voor zowel MQTT als API apparaten
- 12 flow trigger kaarten: apparaat online/offline, snelheid/preset/temperatuur/luchtvochtigheid/fout wijzigingen, commando succes/falen, MQTT broker verbindingsgebeurtenissen, MQTT bericht ontvangen (met wildcard ondersteuning)
- 11 flow conditie kaarten met inversie ondersteuning (is/is niet): apparaat online, snelheidsvergelijkingen (gelijk/boven/onder), preset matching, temperatuur/luchtvochtigheid drempels, foutstatus, MQTT broker verbonden
- 8 flow actie kaarten: stel snelheid in (raw of met timer), stel preset in, start timer, wis wachtrij, stuur virtuele afstandsbediening commando, MQTT publiceren (eenvoudig en geavanceerd met QoS/retain)
- MQTT basis topic abstractie: configureer één basis topic, alle subtopics worden automatisch afgeleid (state, ithostatus, lastcmd, lwt, cmd)
- MQTT functies: TLS ondersteuning, authenticatie, aangepaste client ID, Last Will and Testament (LWT), verbindingslogboek
- API functies: configureerbaar poll interval, authenticatie ondersteuning
- Specifieke capability iconen: snelheidsmeter (RPM velden), alarm driehoek (fout), staafdiagram (bedrijfsuren), teller (opstarten), aan/uit (online), thermometer (temperaturen), waterdruppel (luchtvochtigheid)
- Volledig gelokaliseerd in Engels en Nederlands

Ondersteunde apparaten:
- Itho ventilatiesystemen met NRG.Watch Itho add-on (MQTT of API verbinding)

Installatie:
1. Installeer de app op je Homey
2. Voeg een nieuw apparaat toe: NRG.Watch Itho add-on > NRG.Watch Itho (MQTT) of NRG.Watch Itho (API)
3. Selecteer je Itho apparaattype (Standaard of CC1101 RF module)
4. Voor MQTT: Configureer broker adres, poort, inloggegevens en basis topic (standaard: itho)
5. Voor API: Configureer IP-adres, optionele inloggegevens en poll interval (standaard: 15 seconden)
6. Sla instellingen op en het apparaat maakt automatisch verbinding
7. Bekijk logs op de App Instellingen pagina voor probleemoplossing

Verbindingsmethoden:
- MQTT: Realtime updates via MQTT broker, ondersteunt TLS, authenticatie, LWT
- API: Polling-gebaseerde updates via HTTP API, configureerbaar interval

Bekende beperkingen:
- Lokale netwerktoegang vereist voor zowel MQTT als API
- API gebruikt alleen HTTP (geen HTTPS) - gebruik op vertrouwde netwerken
- Sommige commando's werken alleen op specifieke Itho modellen (PWM2I2C protocol voor HRU200/CVE modellen, CC1101 module voor RF commando's)
- MQTT biedt directe updates; API pollt met geconfigureerde intervallen
- Hardware-specifieke functies zijn mogelijk niet beschikbaar op alle Itho modellen
- Aanvoer-/afvoertemperatuur en absolute luchtvochtigheid worden alleen getoond wanneer het apparaat deze waarden rapporteert
