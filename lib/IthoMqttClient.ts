'use strict';

import Homey from 'homey';
import mqtt from 'mqtt';

interface MqttSettings {
  host: string;
  port: number;
  useTLS: boolean;
  tlsInsecure: boolean;
  keepalive: number;
  username: string;
  password: string;
  useCustomClientId: boolean;
  clientId: string;
  baseTopic: string;
  useLWT: boolean;
  lwtTopic: string;
  lwtMessage: string;
}

interface MessageHandler {
  (topic: string, message: Buffer): void;
}

export default class IthoMqttClient {
  
  private device: Homey.Device;
  private client: mqtt.MqttClient | null = null;
  private subscriptions: Map<string, Set<MessageHandler>> = new Map();
  private logEntries: string[] = [];
  private maxLogEntries = 500;
  private settings: MqttSettings;

  constructor(device: Homey.Device, settings: MqttSettings) {
    this.device = device;
    this.settings = settings;
  }

  async connect() {
    if (this.client) {
      await this.disconnect();
    }

    if (!this.settings.host) {
      this.log('Cannot connect: no broker configured');
      return;
    }

    this.log(`Connecting to MQTT broker at ${this.settings.host}:${this.settings.port}`);

    const protocol = this.settings.useTLS ? 'mqtts' : 'mqtt';
    const url = `${protocol}://${this.settings.host}:${this.settings.port}`;

    const options: mqtt.IClientOptions = {
      keepalive: this.settings.keepalive || 60,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000
    };

    if (this.settings.username) {
      options.username = this.settings.username;
      options.password = this.settings.password;
    }

    if (this.settings.useCustomClientId && this.settings.clientId) {
      options.clientId = this.settings.clientId;
    } else {
      options.clientId = `homey_itho_${Math.random().toString(16).substr(2, 8)}`;
    }

    if (this.settings.useTLS) {
      options.rejectUnauthorized = !this.settings.tlsInsecure;
    }

    if (this.settings.useLWT && this.settings.lwtTopic && this.settings.lwtMessage) {
      options.will = {
        topic: this.settings.lwtTopic,
        payload: this.settings.lwtMessage,
        qos: 0,
        retain: false
      };
    }

    try {
      this.client = mqtt.connect(url, options);

      this.client.on('connect', () => {
        this.log('Connected to MQTT broker');
        this.resubscribeAll();
        this.device.setAvailable().catch(this.error.bind(this));
      });

      this.client.on('error', (error) => {
        this.error('MQTT error:', error.message);
      });

      this.client.on('offline', () => {
        this.log('MQTT client offline');
        this.device.setUnavailable('MQTT broker offline').catch(this.error.bind(this));
      });

      this.client.on('reconnect', () => {
        this.log('Reconnecting to MQTT broker');
      });

      this.client.on('close', () => {
        this.log('MQTT connection closed');
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

    } catch (error) {
      this.error('Failed to connect to MQTT broker:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      this.log('Disconnecting from MQTT broker');
      await new Promise<void>((resolve) => {
        this.client!.end(false, {}, () => {
          this.client = null;
          resolve();
        });
      });
    }
  }

  subscribe(topic: string, handler: MessageHandler) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
      
      if (this.client && this.client.connected) {
        this.client.subscribe(topic, (err) => {
          if (err) {
            this.error(`Failed to subscribe to ${topic}:`, err);
          } else {
            this.log(`Subscribed to topic: ${topic}`);
          }
        });
      }
    }

    this.subscriptions.get(topic)!.add(handler);
  }

  unsubscribe(topic: string, handler: MessageHandler) {
    const handlers = this.subscriptions.get(topic);
    if (handlers) {
      handlers.delete(handler);
      
      if (handlers.size === 0) {
        this.subscriptions.delete(topic);
        
        if (this.client && this.client.connected) {
          this.client.unsubscribe(topic, (err) => {
            if (err) {
              this.error(`Failed to unsubscribe from ${topic}:`, err);
            } else {
              this.log(`Unsubscribed from topic: ${topic}`);
            }
          });
        }
      }
    }
  }

  publish(topic: string, message: string, options?: mqtt.IClientPublishOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        this.error('Cannot publish: MQTT client not connected');
        reject(new Error('MQTT client not connected'));
        return;
      }

      this.client.publish(topic, message, options || {}, (err) => {
        if (err) {
          this.error(`Failed to publish to ${topic}:`, err);
          reject(err);
        } else {
          this.log(`Published to ${topic}: ${message}`);
          resolve();
        }
      });
    });
  }

  private resubscribeAll() {
    if (!this.client || !this.client.connected) {
      return;
    }

    for (const topic of this.subscriptions.keys()) {
      this.client.subscribe(topic, (err) => {
        if (err) {
          this.error(`Failed to resubscribe to ${topic}:`, err);
        } else {
          this.log(`Resubscribed to topic: ${topic}`);
        }
      });
    }
  }

  private handleMessage(topic: string, message: Buffer) {
    const handlers = this.subscriptions.get(topic);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(topic, message);
        } catch (error) {
          this.error(`Error in message handler for ${topic}:`, error);
        }
      }
    }
  }

  isConnected(): boolean {
    return this.client !== null && this.client.connected;
  }

  getLog(): string[] {
    return [...this.logEntries];
  }

  updateSettings(settings: MqttSettings) {
    this.settings = settings;
  }

  private log(...args: any[]) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const message = `${timestamp} [INFO] ${args.join(' ')}`;
    this.device.log(message);
    this.addLogEntry(message);
  }

  private error(...args: any[]) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const message = `${timestamp} [ERROR] ${args.join(' ')}`;
    this.device.error(message);
    this.addLogEntry(message);
  }

  private addLogEntry(message: string) {
    this.logEntries.push(message);
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries.shift();
    }
  }

}
