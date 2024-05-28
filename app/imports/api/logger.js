import { Logger }      from 'meteor/ostrio:logger';
import { AppLogs } from './collections';

class AppLogger {

  static log = new Logger();
  
  static getLog() {
    return AppLogger.log;
  }
}

export { AppLogger };
