enum LogLevel {
  Debug = 1,
  Info = 2,
  Warn = 3,
  Error = 4,
  Off = 5
}

/**
 * A simple log service currently only supporting console output...
 */
export class LogService {
  private logLevel = LogLevel.Debug

  debug(msg: string, withContext = true) {
    this.writeToLog(msg, LogLevel.Debug, withContext)
  }

  info(msg: string, withContext = true) {
    this.writeToLog(msg, LogLevel.Info, withContext)
  }

  warn(msg: string, withContext = true) {
    this.writeToLog(msg, LogLevel.Warn, withContext)
  }

  error(msg: string, withContext = true) {
    this.writeToLog(msg, LogLevel.Error, withContext)
  }

  private writeToLog(msg: string, level: LogLevel, withContext: boolean) {
    if (level >= this.logLevel) {
      let message = ''
      if (withContext) {
        message += new Date().toISOString() + ' - ' + LogLevel[level] + ' - '
      }
      message += msg
      console.log(message)
    }
  }
}
