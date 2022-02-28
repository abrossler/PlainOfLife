import { Injectable } from '@angular/core'
import { LogService as NonInjectableLogService } from './pol/util/log.service'

/**
 * An injectable log service for use in Angular
 */
@Injectable()
export class LogService extends NonInjectableLogService {}
