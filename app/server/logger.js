import { Logger }     from 'meteor/ostrio:logger';
import { LoggerFile } from 'meteor/ostrio:loggerfile';

class AppLogger {

  constructor() {

    console.log("CONSTRUCTOR");
    
    this.log = new Logger();
    this.loggerConfig();
  }

  getLog() {
    return this.log;
  }

  loggerConfig() {

    // Initialize LoggerFile:
    const LogFile = new LoggerFile(this.log, {
      fileNameFormat(time) {
        // Create log-files daily
        return (time.getDate()) + '-' + (time.getMonth() + 1) + '-' + (time.getFullYear()) + '.log';
      },
      format(time, level, message, data, userId) {
        // Omit Date and hours from messages
        return '[' + level + '] | ' + time.getDate() + '-' + (time.getMonth() + 1) + '-' + (time.getFullYear()) + ' ' + (time.getHours()) + ':' + (time.getMinutes()) + ':' + (time.getSeconds()) + ' | \'' + message + '\' | User: ' + userId + '\r\n';
      },
      path: '/home/greg/workspace-idevfsd/wp-veritas/app/logs' // Use absolute storage path
    });

    // Enable LoggerFile with default settings
    LogFile.enable();
  }
}



export { AppLogger };
