
enum LogLevel {
    Debug = 1,
    Info = 2,
    Warn = 3,
    Error = 4,
    Off = 5
  }

export class LogService2 {
    private logLevel = LogLevel.Info
  
    debug(msg: string) {
      this.writeToLog(msg, LogLevel.Debug)
    }
  
    info(msg: string) {
      this.writeToLog(msg, LogLevel.Info)
    }
  
    warn(msg: string) {
      this.writeToLog(msg, LogLevel.Warn)
    }
  
    error(msg: string) {
      this.writeToLog(msg, LogLevel.Error)
    }
  
    private writeToLog(msg: string, level: LogLevel) {
      if (level >= this.logLevel) {
        console.log(new Date().toISOString() + ' - ' + LogLevel[this.logLevel] + ' - ' + msg)
      }
    }
  }