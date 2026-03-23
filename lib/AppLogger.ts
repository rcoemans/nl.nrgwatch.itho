'use strict';

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  source: string;
  message: string;
}

export class AppLogger {
  private logs: LogEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries: number = 500) {
    this.maxEntries = maxEntries;
  }

  info(source: string, message: string): void {
    this.addEntry('INFO', source, message);
  }

  warn(source: string, message: string): void {
    this.addEntry('WARN', source, message);
  }

  error(source: string, message: string): void {
    this.addEntry('ERROR', source, message);
  }

  private addEntry(level: LogEntry['level'], source: string, message: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      level,
      source,
      message
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxEntries) {
      this.logs.splice(0, this.logs.length - this.maxEntries);
    }
  }

  getLogs(source?: string): LogEntry[] {
    if (source) {
      return this.logs.filter(e => e.source === source);
    }
    return [...this.logs];
  }

  getLogsAsText(source?: string): string {
    const entries = this.getLogs(source);
    return entries
      .map(e => `${e.timestamp} [${e.level}] [${e.source}] ${e.message}`)
      .join('\n');
  }

  clear(source?: string): void {
    if (source) {
      this.logs = this.logs.filter(e => e.source !== source);
    } else {
      this.logs = [];
    }
  }
}
