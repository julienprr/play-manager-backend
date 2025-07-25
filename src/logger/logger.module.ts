// src/common/logger/logger.module.ts
import { Module } from '@nestjs/common';
import { JsonLoggerService } from './logger.service';

@Module({
  providers: [JsonLoggerService],
  exports: [JsonLoggerService],
})
export class LoggerModule {}
