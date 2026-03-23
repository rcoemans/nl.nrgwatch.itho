'use strict';

import Homey from 'homey';

module.exports = class IthoApiDriver extends Homey.Driver {

  async onInit() {
    this.log('Itho API Driver has been initialized');
  }

  async onPair(session: any) {
    session.setHandler('list_devices', async () => {
      return [
        {
          name: 'NRG.Watch Itho (API)',
          data: {
            id: `itho-api-${Date.now()}`
          },
          settings: {
            api_host: '',
            api_username: '',
            api_password: '',
            api_poll_interval: 15
          }
        }
      ];
    });
  }

}
