'use strict';

module.exports = {

  async getLogs({ homey }: { homey: any }) {
    try {
      const app = homey.app;
      if (!app || !app.appLogger) {
        return 'App logger not yet initialized.';
      }
      return app.appLogger.getLogsAsText() || 'No log entries yet.';
    } catch (e: any) {
      return 'Error: ' + (e.message || String(e));
    }
  },

  async getLogsMqtt({ homey }: { homey: any }) {
    try {
      const app = homey.app;
      if (!app || !app.appLogger) {
        return 'App logger not yet initialized.';
      }
      return app.appLogger.getLogsAsText('MQTT') || 'No log entries yet.';
    } catch (e: any) {
      return 'Error: ' + (e.message || String(e));
    }
  },

  async getLogsApi({ homey }: { homey: any }) {
    try {
      const app = homey.app;
      if (!app || !app.appLogger) {
        return 'App logger not yet initialized.';
      }
      return app.appLogger.getLogsAsText('API') || 'No log entries yet.';
    } catch (e: any) {
      return 'Error: ' + (e.message || String(e));
    }
  },

  async getLogsApp({ homey }: { homey: any }) {
    try {
      const app = homey.app;
      if (!app || !app.appLogger) {
        return 'App logger not yet initialized.';
      }
      return app.appLogger.getLogsAsText('App') || 'No log entries yet.';
    } catch (e: any) {
      return 'Error: ' + (e.message || String(e));
    }
  },

  async clearLogs({ homey }: { homey: any }) {
    try {
      const app = homey.app;
      if (!app || !app.appLogger) {
        return 'App logger not yet initialized.';
      }
      app.appLogger.clear();
      return 'Logs cleared.';
    } catch (e: any) {
      return 'Error: ' + (e.message || String(e));
    }
  }

};
