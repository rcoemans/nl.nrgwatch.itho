'use strict';

import Homey from 'homey';

module.exports = class IthoMqttDriver extends Homey.Driver {

  async onInit() {
    this.log('Itho MQTT Driver has been initialized');
  }

  async onPair(session: any) {
    session.setHandler('list_devices', async () => {
      return [
        {
          name: 'NRG.Watch Itho (MQTT)',
          data: {
            id: `itho-mqtt-${Date.now()}`
          },
          settings: {
            mqtt_host: 'localhost',
            mqtt_port: 1883,
            mqtt_tls: false,
            mqtt_tls_insecure: false,
            mqtt_keepalive: 60,
            mqtt_username: '',
            mqtt_password: '',
            mqtt_use_custom_client_id: false,
            mqtt_client_id: '',
            mqtt_base_topic: 'itho',
            mqtt_use_lwt: false,
            mqtt_lwt_topic: '',
            mqtt_lwt_message: ''
          }
        }
      ];
    });
  }

}
