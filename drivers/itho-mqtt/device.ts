'use strict';

import Homey from 'homey';
import IthoMqttClient from '../../lib/IthoMqttClient';
import IthoStateNormalizer, { IthoStatusPayload, NormalizedState } from '../../lib/IthoStateNormalizer';
import IthoCommandMapper, { IthoCommand } from '../../lib/IthoCommandMapper';
import { AppLogger } from '../../lib/AppLogger';

module.exports = class IthoMqttDevice extends Homey.Device {

  private mqttClient?: IthoMqttClient;
  private messageHandlers: Map<string, (topic: string, message: Buffer) => void> = new Map();
  private currentState: NormalizedState | null = null;
  private previousSpeed: number = 0;
  private previousPreset: string | null = null;
  private previousTemperature: number | null = null;
  private previousHumidity: number | null = null;
  private previousErrorCode: number = 0;

  private get appLogger(): AppLogger {
    return (this.homey.app as any).appLogger;
  }

  private appLog(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (this.appLogger) {
      this.appLogger[level]('MQTT', message);
    }
  }

  async onInit() {
    this.log('Itho MQTT device has been initialized');
    this.appLog('Device initialized');

    const settings = this.getSettings();
    this.log('Current settings:', JSON.stringify({
      host: settings.mqtt_host,
      port: settings.mqtt_port,
      tls: settings.mqtt_tls,
      baseTopic: settings.mqtt_base_topic,
      username: settings.mqtt_username ? '(set)' : '(empty)',
      useLWT: settings.mqtt_use_lwt
    }));
    this.appLog(`Settings loaded: host=${settings.mqtt_host}, port=${settings.mqtt_port}, topic=${settings.mqtt_base_topic}`);

    this.registerCapabilityListeners();

    try {
      await this.initializeMqttClient();
    } catch (error) {
      this.error('Failed during MQTT initialization:', error);
      this.appLog(`Initialization failed: ${error}`, 'error');
    }
  }

  async onSettings({ oldSettings, newSettings, changedKeys }: {
    oldSettings: { [key: string]: boolean | string | number | undefined | null };
    newSettings: { [key: string]: boolean | string | number | undefined | null };
    changedKeys: string[];
  }): Promise<string | void> {
    this.log('Settings changed:', changedKeys.join(', '));

    // Schedule reconnect after settings are persisted
    this.homey.setTimeout(async () => {
      this.log('Reconnecting MQTT after settings change...');
      try {
        await this.reconnectMqtt();
      } catch (error) {
        this.error('Failed to reconnect after settings change:', error);
      }
    }, 1000);
  }

  async onDeleted() {
    this.log('Itho MQTT device deleted');
    if (this.mqttClient) {
      await this.mqttClient.disconnect();
    }
  }

  private async initializeMqttClient() {
    const settings = this.getSettings();
    
    this.mqttClient = new IthoMqttClient(this, {
      host: settings.mqtt_host as string,
      port: settings.mqtt_port as number,
      useTLS: settings.mqtt_tls as boolean,
      tlsInsecure: settings.mqtt_tls_insecure as boolean,
      keepalive: settings.mqtt_keepalive as number,
      username: settings.mqtt_username as string,
      password: settings.mqtt_password as string,
      useCustomClientId: settings.mqtt_use_custom_client_id as boolean,
      clientId: settings.mqtt_client_id as string,
      baseTopic: settings.mqtt_base_topic as string,
      useLWT: settings.mqtt_use_lwt as boolean,
      lwtTopic: settings.mqtt_lwt_topic as string,
      lwtMessage: settings.mqtt_lwt_message as string
    });

    try {
      this.appLog(`Connecting to broker ${settings.mqtt_host}:${settings.mqtt_port}`);
      await this.mqttClient.connect();
      this.appLog('Connected to broker');
      this.subscribeToTopics();
    } catch (error) {
      this.error('Failed to initialize MQTT client:', error);
      this.appLog(`Connection failed: ${error}`, 'error');
      await this.setUnavailable('Failed to connect to MQTT broker');
    }
  }

  private async reconnectMqtt() {
    this.appLog('Reconnecting...');
    if (this.mqttClient) {
      this.unsubscribeFromAllTopics();
      await this.mqttClient.disconnect();
      this.appLog('Disconnected from broker');
    }
    await this.initializeMqttClient();
  }

  private subscribeToTopics() {
    if (!this.mqttClient) return;

    const baseTopic = this.getSetting('mqtt_base_topic') as string || 'itho';

    const statusTopic = `${baseTopic}/ithostatus`;
    const statusHandler = (topic: string, message: Buffer) => {
      this.handleStatusMessage(message);
    };
    this.messageHandlers.set(statusTopic, statusHandler);
    this.mqttClient.subscribe(statusTopic, statusHandler);
    this.appLog(`Subscription added ${statusTopic}`);

    const stateTopic = `${baseTopic}/state`;
    const stateHandler = (topic: string, message: Buffer) => {
      this.handleStateMessage(message);
    };
    this.messageHandlers.set(stateTopic, stateHandler);
    this.mqttClient.subscribe(stateTopic, stateHandler);
    this.appLog(`Subscription added ${stateTopic}`);

    const lwtTopic = `${baseTopic}/lwt`;
    const lwtHandler = (topic: string, message: Buffer) => {
      this.handleLWTMessage(message);
    };
    this.messageHandlers.set(lwtTopic, lwtHandler);
    this.mqttClient.subscribe(lwtTopic, lwtHandler);
    this.appLog(`Subscription added ${lwtTopic}`);

    const lastcmdTopic = `${baseTopic}/lastcmd`;
    const lastcmdHandler = (topic: string, message: Buffer) => {
      this.handleLastCommandMessage(message);
    };
    this.messageHandlers.set(lastcmdTopic, lastcmdHandler);
    this.mqttClient.subscribe(lastcmdTopic, lastcmdHandler);
    this.appLog(`Subscription added ${lastcmdTopic}`);
  }

  private unsubscribeFromAllTopics() {
    if (!this.mqttClient) return;

    for (const [topic, handler] of this.messageHandlers.entries()) {
      this.mqttClient.unsubscribe(topic, handler);
    }
    this.messageHandlers.clear();
  }

  private handleStatusMessage(message: Buffer) {
    try {
      const payload = message.toString();
      const data: IthoStatusPayload = JSON.parse(payload);

      const currentSpeed = this.currentState?.currentSpeed ?? 0;
      this.currentState = IthoStateNormalizer.normalize(data, currentSpeed, 'mqtt');

      this.updateCapabilitiesFromState();
    } catch (error) {
      this.error('Failed to parse status message:', error);
    }
  }

  private handleStateMessage(message: Buffer) {
    try {
      const payload = message.toString().trim();
      const speedState = parseInt(payload);

      if (!isNaN(speedState)) {
        const statusData = this.currentState?.rawStatus || null;
        this.currentState = IthoStateNormalizer.normalize(statusData, speedState, 'mqtt');
        
        this.updateCapabilitiesFromState();

        if (speedState !== this.previousSpeed) {
          this.homey.flow.getDeviceTriggerCard('fan_speed_changed')
            .trigger(this, {
              speed_raw: speedState,
              speed_percent: Math.round((speedState / 255) * 100),
              previous_speed_raw: this.previousSpeed
            })
            .catch(this.error);
          
          this.previousSpeed = speedState;
        }

        const preset = this.currentState.preset;
        if (preset && preset !== this.previousPreset) {
          this.homey.flow.getDeviceTriggerCard('fan_preset_changed')
            .trigger(this, {
              preset: preset,
              previous_preset: this.previousPreset || 'unknown'
            })
            .catch(this.error);
          
          this.previousPreset = preset;
        }
      }
    } catch (error) {
      this.error('Failed to parse state message:', error);
    }
  }

  private handleLWTMessage(message: Buffer) {
    try {
      const payload = message.toString().trim().toLowerCase();
      const isOnline = payload === 'online';

      if (isOnline) {
        this.setAvailable().catch(this.error);
        this.homey.flow.getDeviceTriggerCard('device_online')
          .trigger(this, {
            device_name: this.getName(),
            transport: 'MQTT'
          })
          .catch(this.error);
      } else {
        this.setUnavailable('Device offline').catch(this.error);
        this.homey.flow.getDeviceTriggerCard('device_offline')
          .trigger(this, {
            device_name: this.getName(),
            transport: 'MQTT'
          })
          .catch(this.error);
      }
    } catch (error) {
      this.error('Failed to parse LWT message:', error);
    }
  }

  private handleLastCommandMessage(message: Buffer) {
    try {
      const payload = message.toString();
      this.log('Last command received:', payload);
    } catch (error) {
      this.error('Failed to parse last command message:', error);
    }
  }

  private updateCapabilitiesFromState() {
    if (!this.currentState) return;

    if (this.currentState.currentSpeed !== null) {
      this.setCapabilityValue('itho_fan_speed_raw', this.currentState.currentSpeed).catch(this.error);
    }

    if (this.currentState.preset) {
      this.setCapabilityValue('itho_fan_preset', this.currentState.preset).catch(this.error);
    }

    if (this.currentState.temperature !== null) {
      this.setCapabilityValue('measure_temperature', this.currentState.temperature).catch(this.error);
      
      if (this.currentState.temperature !== this.previousTemperature) {
        this.homey.flow.getDeviceTriggerCard('temperature_changed')
          .trigger(this, {
            temperature: this.currentState.temperature,
            previous_temperature: this.previousTemperature ?? 0
          })
          .catch(this.error);
        this.previousTemperature = this.currentState.temperature;
      }
    }

    if (this.currentState.humidity !== null) {
      this.setCapabilityValue('measure_humidity', this.currentState.humidity).catch(this.error);
      
      if (this.currentState.humidity !== this.previousHumidity) {
        this.homey.flow.getDeviceTriggerCard('humidity_changed')
          .trigger(this, {
            humidity: this.currentState.humidity,
            previous_humidity: this.previousHumidity ?? 0
          })
          .catch(this.error);
        this.previousHumidity = this.currentState.humidity;
      }
    }

    if (this.currentState.fanSpeedRpm !== null) {
      this.setCapabilityValue('itho_fan_speed_rpm', this.currentState.fanSpeedRpm).catch(this.error);
    }

    if (this.currentState.fanSetpointRpm !== null) {
      this.setCapabilityValue('itho_fan_setpoint_rpm', this.currentState.fanSetpointRpm).catch(this.error);
    }

    if (this.currentState.ventilationSetpointPct !== null) {
      this.setCapabilityValue('itho_ventilation_setpoint', this.currentState.ventilationSetpointPct).catch(this.error);
    }

    if (this.currentState.errorCode !== null) {
      this.setCapabilityValue('itho_error_code', this.currentState.errorCode).catch(this.error);
      
      if (this.currentState.errorCode !== this.previousErrorCode) {
        this.homey.flow.getDeviceTriggerCard('error_state_changed')
          .trigger(this, {
            error_code: this.currentState.errorCode,
            previous_error_code: this.previousErrorCode
          })
          .catch(this.error);
        this.previousErrorCode = this.currentState.errorCode;
      }
    }

    if (this.currentState.totalOperationHours !== null) {
      this.setCapabilityValue('itho_total_operation', this.currentState.totalOperationHours).catch(this.error);
    }

    if (this.currentState.startupCounter !== null) {
      this.setCapabilityValue('itho_startup_counter', this.currentState.startupCounter).catch(this.error);
    }

    if (this.currentState.absoluteHumidity !== null) {
      this.setCapabilityValue('itho_absolute_humidity', this.currentState.absoluteHumidity).catch(this.error);
    }

    if (this.currentState.supplyTemperature !== null) {
      this.setCapabilityValue('itho_supply_temperature', this.currentState.supplyTemperature).catch(this.error);
    }

    if (this.currentState.exhaustTemperature !== null) {
      this.setCapabilityValue('itho_exhaust_temperature', this.currentState.exhaustTemperature).catch(this.error);
    }

    this.setCapabilityValue('itho_online', this.currentState.online).catch(this.error);
  }

  private registerCapabilityListeners() {
    this.registerCapabilityListener('itho_fan_preset', async (value: string) => {
      await this.setFanPreset(value);
    });
  }

  async setFanPreset(preset: string) {
    const command: IthoCommand = {
      type: 'preset',
      value: preset
    };

    await this.sendCommand(command);
  }

  async setFanSpeed(speed: number, timer?: number) {
    const command: IthoCommand = {
      type: 'speed',
      value: speed,
      timer: timer
    };

    await this.sendCommand(command);
  }

  async startTimer(seconds: number) {
    const command: IthoCommand = {
      type: 'timer',
      value: seconds
    };

    await this.sendCommand(command);
  }

  async clearQueue() {
    const command: IthoCommand = {
      type: 'clearqueue'
    };

    await this.sendCommand(command);
  }

  async sendVirtualRemote(remoteCommand: string) {
    const command: IthoCommand = {
      type: 'vremote',
      value: remoteCommand
    };

    await this.sendCommand(command);
  }

  private async sendCommand(command: IthoCommand) {
    if (!this.mqttClient || !this.mqttClient.isConnected()) {
      throw new Error('MQTT client not connected');
    }

    const baseTopic = this.getSetting('mqtt_base_topic') as string || 'itho';
    const cmdTopic = `${baseTopic}/cmd`;
    const payload = IthoCommandMapper.buildMqttPayload(command);

    try {
      await this.mqttClient.publish(cmdTopic, payload);
      
      this.homey.flow.getDeviceTriggerCard('command_sent_success')
        .trigger(this, {
          command_name: command.type,
          command_value: JSON.stringify(command.value),
          transport: 'MQTT'
        })
        .catch(this.error);
    } catch (error) {
      this.error('Failed to send command:', error);
      
      this.homey.flow.getDeviceTriggerCard('command_failed')
        .trigger(this, {
          command_name: command.type,
          command_value: JSON.stringify(command.value),
          error_message: error instanceof Error ? error.message : 'Unknown error',
          transport: 'MQTT'
        })
        .catch(this.error);
      
      throw error;
    }
  }

  async publishMqttMessage(topic: string, message: string, qos?: 0 | 1 | 2, retain?: boolean) {
    if (!this.mqttClient || !this.mqttClient.isConnected()) {
      throw new Error('MQTT client not connected');
    }

    await this.mqttClient.publish(topic, message, { qos: qos || 0, retain: retain || false });
  }

  isMqttConnected(): boolean {
    return this.mqttClient?.isConnected() || false;
  }

  getMqttLog(): string[] {
    return this.mqttClient?.getLog() || [];
  }

}
