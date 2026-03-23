'use strict';

import Homey from 'homey';
import http from 'http';
import IthoStateNormalizer, { IthoStatusPayload, NormalizedState } from '../../lib/IthoStateNormalizer';
import IthoCommandMapper, { IthoCommand } from '../../lib/IthoCommandMapper';
import { AppLogger } from '../../lib/AppLogger';

module.exports = class IthoApiDevice extends Homey.Device {

  private pollTimer?: NodeJS.Timeout;
  private currentState: NormalizedState | null = null;
  private previousSpeed: number = 0;
  private previousPreset: string | null = null;
  private previousTemperature: number | null = null;
  private previousHumidity: number | null = null;
  private previousErrorCode: number = 0;
  private failureCount: number = 0;
  private maxFailures: number = 3;

  private get appLogger(): AppLogger {
    return (this.homey.app as any).appLogger;
  }

  private appLog(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (this.appLogger) {
      this.appLogger[level]('API', message);
    }
  }

  async onInit() {
    this.log('Itho API device has been initialized');
    this.appLog('Device initialized');

    const settings = this.getSettings();
    this.log('Current settings:', JSON.stringify({
      host: settings.api_host,
      username: settings.api_username ? '(set)' : '(empty)',
      poll_interval: settings.api_poll_interval
    }));
    this.appLog(`Settings loaded: host=${settings.api_host}`);

    this.registerCapabilityListeners();
    this.startPolling();
  }

  async onSettings({ oldSettings, newSettings, changedKeys }: {
    oldSettings: { [key: string]: boolean | string | number | undefined | null };
    newSettings: { [key: string]: boolean | string | number | undefined | null };
    changedKeys: string[];
  }): Promise<string | void> {
    this.log('Settings changed:', changedKeys.join(', '));

    // Always restart polling when any setting changes
    this.stopPolling();

    // Schedule restart after settings are persisted
    this.homey.setTimeout(() => {
      this.startPolling();
    }, 1000);
  }

  async onDeleted() {
    this.log('Itho API device deleted');
    this.stopPolling();
  }

  private startPolling() {
    this.stopPolling();

    const host = this.getSetting('api_host') as string;
    if (!host) {
      this.log('No API host configured, waiting for settings...');
      return;
    }

    const intervalSec = (this.getSetting('api_poll_interval') as number) || 15;
    this.log(`Starting polling every ${intervalSec}s to ${host}`);
    this.appLog(`Polling started: ${host} every ${intervalSec}s`);

    // Poll immediately
    this.pollDevice().catch((err: Error) => this.error('Poll error:', err.message));

    // Then poll on interval
    this.pollTimer = this.homey.setInterval(() => {
      this.pollDevice().catch((err: Error) => this.error('Poll error:', err.message));
    }, intervalSec * 1000);
  }

  private stopPolling() {
    if (this.pollTimer) {
      this.homey.clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  private httpGet(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
          }
        });
      });
      request.on('error', (err: Error) => reject(err));
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Request timed out'));
      });
    });
  }

  private async pollDevice() {
    const host = this.getSetting('api_host') as string;

    if (!host) {
      return;
    }

    try {
      const baseUrl = `http://${host}`;
      const username = this.getSetting('api_username') as string;
      const password = this.getSetting('api_password') as string;

      const statusUrl = this.buildApiUrl(baseUrl, 'ithostatus', username, password);
      const speedUrl = this.buildApiUrl(baseUrl, 'currentspeed', username, password);

      this.log(`Polling ${host}...`);

      const [statusText, speedText] = await Promise.all([
        this.httpGet(statusUrl),
        this.httpGet(speedUrl)
      ]);

      const statusData: IthoStatusPayload = JSON.parse(statusText);
      const speedValue = parseInt(speedText.trim());

      this.log(`Status keys: ${Object.keys(statusData).join(', ')}`);
      this.log(`Speed value: ${speedValue}`);

      this.currentState = IthoStateNormalizer.normalize(
        statusData,
        isNaN(speedValue) ? null : speedValue,
        'api'
      );

      this.updateCapabilitiesFromState();

      if (this.failureCount > 0) {
        this.log('Connection restored after failures');
        this.appLog('Connection restored after failures');
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
          .catch((e: Error) => this.error(e.message));

        this.previousSpeed = speedValue;
      }

      const preset = this.currentState.preset;
      if (preset && preset !== this.previousPreset) {
        this.homey.flow.getDeviceTriggerCard('fan_preset_changed')
          .trigger(this, {
            preset: preset,
            previous_preset: this.previousPreset || 'unknown'
          })
          .catch((e: Error) => this.error(e.message));

        this.previousPreset = preset;
      }

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.error(`Poll failed: ${msg}`);
      this.appLog(`Poll failed: ${msg}`, 'error');
      this.failureCount++;

      if (this.failureCount >= this.maxFailures) {
        this.appLog(`Device marked unavailable after ${this.failureCount} failures`, 'error');
        await this.setUnavailable(`Failed to connect to API: ${msg}`);
      }
    }
  }

  private updateCapabilitiesFromState() {
    if (!this.currentState) return;

    const s = this.currentState;

    if (s.currentSpeed !== null) {
      this.setCapabilityValue('itho_fan_speed_raw', s.currentSpeed).catch(this.error);
    }
    if (s.preset) {
      this.setCapabilityValue('itho_fan_preset', s.preset).catch(this.error);
    }
    if (s.temperature !== null) {
      this.setCapabilityValue('measure_temperature', s.temperature).catch(this.error);
      if (s.temperature !== this.previousTemperature) {
        this.homey.flow.getDeviceTriggerCard('temperature_changed')
          .trigger(this, { temperature: s.temperature, previous_temperature: this.previousTemperature ?? 0 })
          .catch((e: Error) => this.error(e.message));
        this.previousTemperature = s.temperature;
      }
    }
    if (s.humidity !== null) {
      this.setCapabilityValue('measure_humidity', s.humidity).catch(this.error);
      if (s.humidity !== this.previousHumidity) {
        this.homey.flow.getDeviceTriggerCard('humidity_changed')
          .trigger(this, { humidity: s.humidity, previous_humidity: this.previousHumidity ?? 0 })
          .catch((e: Error) => this.error(e.message));
        this.previousHumidity = s.humidity;
      }
    }
    if (s.fanSpeedRpm !== null) {
      this.setCapabilityValue('itho_fan_speed_rpm', s.fanSpeedRpm).catch(this.error);
    }
    if (s.fanSetpointRpm !== null) {
      this.setCapabilityValue('itho_fan_setpoint_rpm', s.fanSetpointRpm).catch(this.error);
    }
    if (s.ventilationSetpointPct !== null) {
      this.setCapabilityValue('itho_ventilation_setpoint', s.ventilationSetpointPct).catch(this.error);
    }
    if (s.errorCode !== null) {
      this.setCapabilityValue('itho_error_code', s.errorCode).catch(this.error);
      if (s.errorCode !== this.previousErrorCode) {
        this.homey.flow.getDeviceTriggerCard('error_state_changed')
          .trigger(this, { error_code: s.errorCode, previous_error_code: this.previousErrorCode })
          .catch((e: Error) => this.error(e.message));
        this.previousErrorCode = s.errorCode;
      }
    }
    if (s.totalOperationHours !== null) {
      this.setCapabilityValue('itho_total_operation', s.totalOperationHours).catch(this.error);
    }
    if (s.startupCounter !== null) {
      this.setCapabilityValue('itho_startup_counter', s.startupCounter).catch(this.error);
    }
    if (s.absoluteHumidity !== null) {
      this.setCapabilityValue('itho_absolute_humidity', s.absoluteHumidity).catch(this.error);
    }
    if (s.supplyTemperature !== null) {
      this.setCapabilityValue('itho_supply_temperature', s.supplyTemperature).catch(this.error);
    }
    if (s.exhaustTemperature !== null) {
      this.setCapabilityValue('itho_exhaust_temperature', s.exhaustTemperature).catch(this.error);
    }
    this.setCapabilityValue('itho_online', s.online).catch(this.error);
  }

  private registerCapabilityListeners() {
    this.registerCapabilityListener('itho_fan_preset', async (value: string) => {
      await this.setFanPreset(value);
    });
  }

  async setFanPreset(preset: string) {
    await this.sendCommand({ type: 'preset', value: preset });
  }

  async setFanSpeed(speed: number, timer?: number) {
    await this.sendCommand({ type: 'speed', value: speed, timer });
  }

  async startTimer(seconds: number) {
    await this.sendCommand({ type: 'timer', value: seconds });
  }

  async clearQueue() {
    await this.sendCommand({ type: 'clearqueue' });
  }

  async sendVirtualRemote(remoteCommand: string) {
    await this.sendCommand({ type: 'vremote', value: remoteCommand });
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
      await this.httpGet(url);

      this.homey.flow.getDeviceTriggerCard('command_sent_success')
        .trigger(this, {
          command_name: command.type,
          command_value: JSON.stringify(command.value),
          transport: 'API'
        })
        .catch((e: Error) => this.error(e.message));

      // Re-poll after command
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
        .catch((e: Error) => this.error(e.message));

      throw error;
    }
  }

  private buildApiUrl(baseUrl: string, endpoint: string, username?: string, password?: string): string {
    const params = new URLSearchParams();
    if (username && username.trim() !== '') {
      params.append('username', username);
      params.append('password', password || '');
    }
    params.append('get', endpoint);
    return `${baseUrl}/api.html?${params.toString()}`;
  }

}
