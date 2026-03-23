'use strict';

export interface IthoCommand {
  type: 'speed' | 'preset' | 'timer' | 'clearqueue' | 'vremote' | 'rfremote';
  value?: any;
  timer?: number;
}

export default class IthoCommandMapper {

  static buildMqttPayload(command: IthoCommand): string {
    let payload: any = {};

    switch (command.type) {
      case 'speed':
        payload.speed = command.value;
        if (command.timer !== undefined && command.timer > 0) {
          payload.timer = command.timer;
        }
        break;

      case 'preset':
        payload.command = command.value;
        break;

      case 'timer':
        payload.timer = command.value;
        break;

      case 'clearqueue':
        payload.clearqueue = 'true';
        break;

      case 'vremote':
        payload.vremotecmd = command.value;
        break;

      case 'rfremote':
        payload.rfremotecmd = command.value;
        break;

      default:
        throw new Error(`Unknown command type: ${command.type}`);
    }

    return JSON.stringify(payload);
  }

  static buildApiUrl(baseUrl: string, command: IthoCommand, username?: string, password?: string): string {
    const params = new URLSearchParams();

    if (username) {
      params.append('username', username);
      params.append('password', password || '');
    }

    switch (command.type) {
      case 'speed':
        params.append('speed', command.value.toString());
        if (command.timer !== undefined && command.timer > 0) {
          params.append('timer', command.timer.toString());
        }
        break;

      case 'preset':
        params.append('command', command.value);
        break;

      case 'timer':
        params.append('timer', command.value.toString());
        break;

      case 'clearqueue':
        params.append('clearqueue', 'true');
        break;

      case 'vremote':
        params.append('vremotecmd', command.value);
        break;

      case 'rfremote':
        params.append('rfremotecmd', command.value);
        break;

      default:
        throw new Error(`Unknown command type: ${command.type}`);
    }

    return `${baseUrl}/api.html?${params.toString()}`;
  }

}
