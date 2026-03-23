'use strict';

import Homey from 'homey';

module.exports = class NRGWatchIthoApp extends Homey.App {

  async onInit() {
    this.log('NRG.Watch Itho add-on has been initialized');
    
    this.registerFlowCards();
  }

  registerFlowCards() {
    // Condition cards
    this.homey.flow.getConditionCard('device_is_online')
      .registerRunListener(async (args) => {
        return args.device.getAvailable();
      });

    this.homey.flow.getConditionCard('fan_speed_equal')
      .registerRunListener(async (args) => {
        const currentSpeed = args.device.getCapabilityValue('itho_fan_speed_raw');
        return currentSpeed === args.speed;
      });

    this.homey.flow.getConditionCard('fan_speed_above')
      .registerRunListener(async (args) => {
        const currentSpeed = args.device.getCapabilityValue('itho_fan_speed_raw');
        return currentSpeed > args.speed;
      });

    this.homey.flow.getConditionCard('fan_speed_below')
      .registerRunListener(async (args) => {
        const currentSpeed = args.device.getCapabilityValue('itho_fan_speed_raw');
        return currentSpeed < args.speed;
      });

    this.homey.flow.getConditionCard('fan_preset_is')
      .registerRunListener(async (args) => {
        const currentPreset = args.device.getCapabilityValue('itho_fan_preset');
        return currentPreset === args.preset;
      });

    this.homey.flow.getConditionCard('temperature_above')
      .registerRunListener(async (args) => {
        const currentTemp = args.device.getCapabilityValue('measure_temperature');
        return currentTemp !== null && currentTemp > args.temperature;
      });

    this.homey.flow.getConditionCard('temperature_below')
      .registerRunListener(async (args) => {
        const currentTemp = args.device.getCapabilityValue('measure_temperature');
        return currentTemp !== null && currentTemp < args.temperature;
      });

    this.homey.flow.getConditionCard('humidity_above')
      .registerRunListener(async (args) => {
        const currentHum = args.device.getCapabilityValue('measure_humidity');
        return currentHum !== null && currentHum > args.humidity;
      });

    this.homey.flow.getConditionCard('humidity_below')
      .registerRunListener(async (args) => {
        const currentHum = args.device.getCapabilityValue('measure_humidity');
        return currentHum !== null && currentHum < args.humidity;
      });

    this.homey.flow.getConditionCard('device_has_error')
      .registerRunListener(async (args) => {
        const errorCode = args.device.getCapabilityValue('itho_error_code');
        return errorCode !== null && errorCode !== 0;
      });

    this.homey.flow.getConditionCard('mqtt_broker_connected')
      .registerRunListener(async (args) => {
        return args.device.isMqttConnected ? args.device.isMqttConnected() : false;
      });

    // Action cards
    this.homey.flow.getActionCard('set_fan_speed')
      .registerRunListener(async (args) => {
        await args.device.setFanSpeed(args.speed);
      });

    this.homey.flow.getActionCard('set_fan_preset')
      .registerRunListener(async (args) => {
        await args.device.setFanPreset(args.preset);
      });

    this.homey.flow.getActionCard('start_timer')
      .registerRunListener(async (args) => {
        await args.device.startTimer(args.seconds);
      });

    this.homey.flow.getActionCard('set_speed_with_timer')
      .registerRunListener(async (args) => {
        await args.device.setFanSpeed(args.speed, args.seconds);
      });

    this.homey.flow.getActionCard('clear_queue')
      .registerRunListener(async (args) => {
        await args.device.clearQueue();
      });

    this.homey.flow.getActionCard('send_virtual_remote')
      .registerRunListener(async (args) => {
        await args.device.sendVirtualRemote(args.command);
      });

    // MQTT-specific action cards
    this.homey.flow.getActionCard('mqtt_publish_simple')
      .registerRunListener(async (args) => {
        await args.device.publishMqttMessage(args.topic, args.message);
      });

    this.homey.flow.getActionCard('mqtt_publish_advanced')
      .registerRunListener(async (args) => {
        const qos = parseInt(args.qos) as 0 | 1 | 2;
        const retain = args.retain === 'true';
        await args.device.publishMqttMessage(args.topic, args.message, qos, retain);
      });

    // MQTT trigger card with topic matching
    const mqttMessageReceived = this.homey.flow.getTriggerCard('mqtt_message_received');
    mqttMessageReceived.registerRunListener(async (args, state) => {
      return this.matchMqttTopic(args.topic, state.topic);
    });
  }

  matchMqttTopic(pattern: string, topic: string): boolean {
    const regexPattern = pattern
      .replace(/\+/g, '[^/]+')
      .replace(/#$/, '.*')
      .replace(/\//g, '\\/');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(topic);
  }

}
