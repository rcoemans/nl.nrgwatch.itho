'use strict';

import Homey from 'homey';
import IthoStateNormalizer, { IthoStatusPayload, NormalizedState } from '../../lib/IthoStateNormalizer';
import IthoCommandMapper, { IthoCommand } from '../../lib/IthoCommandMapper';

module.exports = class IthoApiDevice extends Homey.Device {

  private pollInterval?: NodeJS.Timeout;
  private currentState: NormalizedState | null = null;
  private previousSpeed: number = 0;
  private previousPreset: string | null = null;
  private previousTemperature: number | null = null;
  private previousHumidity: number | null = null;
  private previousErrorCode: number = 0;
  private failureCount: number = 0;
  private maxFailures: number = 3;

  async onInit() {
    this.log('Itho API device has been initialized');
    
    this.registerCapabilityListeners();
    this.startPolling();
  }

  async onSettings({ oldSettings, newSettings, changedKeys }: {
    oldSettings: { [key: string]: boolean | string | number | undefined | null };
    newSettings: { [key: string]: boolean | string | number | undefined | null };
    changedKeys: string[];
  }): Promise<string | void> {
    this.log('Settings changed:', changedKeys);

    if (changedKeys.includes('api_poll_interval')) {
      this.stopPolling();
      this.startPolling();
    }

    if (changedKeys.includes('api_host')) {
      await this.pollDevice();
    }
  }

  async onDeleted() {
    this.log('Itho API device deleted');
    this.stopPolling();
  }

  private startPolling() {
    const pollInterval = (this.getSetting('api_poll_interval') as number || 15) * 1000;
    
    this.pollInterval = setInterval(() => {
      this.pollDevice().catch(this.error);
    }, pollInterval);

    this.pollDevice().catch(this.error);
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
  }

  private async pollDevice() {
    const host = this.getSetting('api_host') as string;
    
    if (!host) {
      this.log('No API host configured');
      return;
    }

    try {
      const baseUrl = `http://${host}`;
      const username = this.getSetting('api_username') as string;
      const password = this.getSetting('api_password') as string;

      const statusUrl = this.buildApiUrl(baseUrl, 'ithostatus', username, password);
      const speedUrl = this.buildApiUrl(baseUrl, 'currentspeed', username, password);

      const [statusResponse, speedResponse] = await Promise.all([
        fetch(statusUrl),
        fetch(speedUrl)
      ]);

      if (!statusResponse.ok || !speedResponse.ok) {
        throw new Error(`API request failed: ${statusResponse.status} / ${speedResponse.status}`);
      }

      const statusData = await statusResponse.json() as IthoStatusPayload;
      const speedText = await speedResponse.text();
      const speedValue = parseInt(speedText.trim());

      this.currentState = IthoStateNormalizer.normalize(
        statusData,
        isNaN(speedValue) ? null : speedValue,
        'api'
      );

      this.updateCapabilitiesFromState();

      if (this.failureCount > 0) {
        await this.setAvailable();
        this.failureCount = 0;
      }

      if (speedValue !== this.previousSpeed) {
        this.homey.flow.getDeviceTriggerCard('fan_speed_changed')
          .trigger(this, {
            speed_raw: speedValue,
            speed_percent: Math.round((speedValue / 255) * 100),
            previous_speed_raw: this.previousSpeed
          })
          .catch(this.error);
        
        this.previousSpeed = speedValue;
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

    } catch (error) {
      this.error('Failed to poll device:', error);
      this.failureCount++;

      if (this.failureCount >= this.maxFailures) {
        await this.setUnavailable('Failed to connect to API');
      }
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
    const host = this.getSetting('api_host') as string;
    
    if (!host) {
      throw new Error('No API host configured');
    }

    const baseUrl = `http://${host}`;
    const username = this.getSetting('api_username') as string;
    const password = this.getSetting('api_password') as string;

    const url = IthoCommandMapper.buildApiUrl(baseUrl, command, username, password);

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      this.homey.flow.getDeviceTriggerCard('command_sent_success')
        .trigger(this, {
          command_name: command.type,
          command_value: JSON.stringify(command.value),
          transport: 'API'
        })
        .catch(this.error);

      await this.pollDevice();

    } catch (error) {
      this.error('Failed to send command:', error);
      
      this.homey.flow.getDeviceTriggerCard('command_failed')
        .trigger(this, {
          command_name: command.type,
          command_value: JSON.stringify(command.value),
          error_message: error instanceof Error ? error.message : 'Unknown error',
          transport: 'API'
        })
        .catch(this.error);
      
      throw error;
    }
  }

  private buildApiUrl(baseUrl: string, endpoint: string, username?: string, password?: string): string {
    const params = new URLSearchParams();
    
    if (username) {
      params.append('username', username);
      params.append('password', password || '');
    }
    
    params.append('get', endpoint);
    
    return `${baseUrl}/api.html?${params.toString()}`;
  }

}
