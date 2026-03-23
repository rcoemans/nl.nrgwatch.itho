'use strict';

export interface IthoStatusPayload {
  temp?: number;
  hum?: number;
  Temperature?: number;
  RelativeHumidity?: number;
  ppmw?: number;
  'Ventilation setpoint (%)'?: number;
  'Fan setpoint (rpm)'?: number;
  'Fan speed (rpm)'?: number;
  Error?: number;
  'Total operation (hours)'?: number;
  Selection?: number;
  'Startup counter'?: number;
  'Absence (min)'?: number;
  'Highest CO2 concentration (ppm)'?: number | string;
  'Highest RH concentration (%)'?: number;
}

export interface NormalizedState {
  online: boolean;
  transport: string;
  currentSpeed: number;
  targetSpeed: number;
  preset: string | null;
  temperature: number | null;
  humidity: number | null;
  co2: number | null;
  fanSpeedRpm: number | null;
  fanSetpointRpm: number | null;
  ventilationSetpointPct: number | null;
  errorCode: number;
  selection: number | null;
  startupCounter: number | null;
  totalOperationHours: number | null;
  absenceMinutes: number | null;
  lastCommand: string | null;
  rawStatus: any;
}

export default class IthoStateNormalizer {

  static normalize(
    statusPayload: IthoStatusPayload | null,
    stateValue: number | null,
    transport: 'mqtt' | 'api'
  ): NormalizedState {
    const state: NormalizedState = {
      online: true,
      transport: transport.toUpperCase(),
      currentSpeed: stateValue ?? 0,
      targetSpeed: stateValue ?? 0,
      preset: null,
      temperature: null,
      humidity: null,
      co2: null,
      fanSpeedRpm: null,
      fanSetpointRpm: null,
      ventilationSetpointPct: null,
      errorCode: 0,
      selection: null,
      startupCounter: null,
      totalOperationHours: null,
      absenceMinutes: null,
      lastCommand: null,
      rawStatus: statusPayload || {}
    };

    if (statusPayload) {
      // Temperature - handle multiple field names
      if (statusPayload.temp !== undefined) {
        state.temperature = Number(statusPayload.temp.toFixed(1));
      } else if (statusPayload.Temperature !== undefined) {
        state.temperature = Number(statusPayload.Temperature.toFixed(1));
      }

      // Humidity - handle multiple field names
      if (statusPayload.hum !== undefined) {
        state.humidity = Number(statusPayload.hum.toFixed(1));
      } else if (statusPayload.RelativeHumidity !== undefined) {
        state.humidity = Number(statusPayload.RelativeHumidity.toFixed(1));
      }

      // CO2 / Air quality metric
      if (statusPayload.ppmw !== undefined) {
        state.co2 = statusPayload.ppmw;
      }

      // Fan metrics
      if (statusPayload['Fan speed (rpm)'] !== undefined) {
        state.fanSpeedRpm = statusPayload['Fan speed (rpm)'];
      }

      if (statusPayload['Fan setpoint (rpm)'] !== undefined) {
        state.fanSetpointRpm = statusPayload['Fan setpoint (rpm)'];
      }

      if (statusPayload['Ventilation setpoint (%)'] !== undefined) {
        state.ventilationSetpointPct = statusPayload['Ventilation setpoint (%)'];
      }

      // Error code
      if (statusPayload.Error !== undefined) {
        state.errorCode = statusPayload.Error;
      }

      // Diagnostic fields
      if (statusPayload.Selection !== undefined) {
        state.selection = statusPayload.Selection;
      }

      if (statusPayload['Startup counter'] !== undefined) {
        state.startupCounter = statusPayload['Startup counter'];
      }

      if (statusPayload['Total operation (hours)'] !== undefined) {
        state.totalOperationHours = statusPayload['Total operation (hours)'];
      }

      if (statusPayload['Absence (min)'] !== undefined) {
        state.absenceMinutes = statusPayload['Absence (min)'];
      }
    }

    // Derive preset from speed state
    if (stateValue !== null) {
      state.preset = this.speedToPreset(stateValue);
    }

    return state;
  }

  static speedToPreset(speed: number): string | null {
    // Common Itho speed mappings
    if (speed === 0) return 'away';
    if (speed === 20) return 'low';
    if (speed === 120) return 'medium';
    if (speed === 220) return 'high';
    return null;
  }

  static presetToSpeed(preset: string): number | null {
    const presetMap: { [key: string]: number } = {
      'away': 0,
      'low': 20,
      'medium': 120,
      'high': 220
    };
    return presetMap[preset] ?? null;
  }

}
