'use strict';

module.exports = {
  
  async getLog({ homey, params }: { homey: any, params: { deviceId: string } }) {
    const device = await homey.drivers.getDevice({ id: params.deviceId });
    
    if (device && typeof (device as any).getMqttLog === 'function') {
      const log = (device as any).getMqttLog();
      return { log: log.join('\n') };
    }
    
    return { log: 'No log available' };
  }

};
