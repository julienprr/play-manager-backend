import { ConsoleLogger, LogLevel } from '@nestjs/common';
import os from 'os';

export class JsonLoggerService extends ConsoleLogger {
  constructor(context?: string) {
    const levels = (process.env.LOG_LEVEL ?? 'log,warn,error').split(',') as LogLevel[];
    super(context, { logLevels: levels, colors: false } as any);
  }

  private format(message: string, level: string, context?: string) {
    const hostname = process.env.HOSTNAME || (os?.hostname?.() ?? 'unknown-host');
    return JSON.stringify({
      '@timestamp': new Date().toISOString(),
      'log.level': level,
      message,
      'service.name': 'play-manager-backend',
      'host.name': hostname,
      ...(context ? { context } : {}),
    });
  }

  log(message: string, context?: string) {
    super.log(this.format(message, 'log', context));
  }

  error(message: string, trace?: string, context?: string) {
    super.error(this.format(message, 'error', context), trace);
  }

  warn(message: string, context?: string) {
    super.warn(this.format(message, 'warn', context));
  }

  debug(message: string, context?: string) {
    super.debug(this.format(message, 'debug', context));
  }

  verbose(message: string, context?: string) {
    super.verbose(this.format(message, 'verbose', context));
  }
}
