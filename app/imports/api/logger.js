import { Logger }      from 'meteor/ostrio:logger';
import { LoggerMongo } from 'meteor/ostrio:loggermongo';
import { AppLogs } from './collections';

class AppLogger {

  static log = new Logger();
  
  constructor() {
    this.loggerConfig();
  }

  static getLog() {
    return AppLogger.log;
  }

  loggerConfig() {

    // Initialize LoggerMongo with collection instance:
    const LogMongo = new LoggerMongo(AppLogger.log, {
      collection: AppLogs
    });

    // Enable LoggerMongo with default settings:
    LogMongo.enable();
  }
}

export { AppLogger };