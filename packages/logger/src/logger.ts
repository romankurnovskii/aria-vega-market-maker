import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs';
import {
  createLogger as winstonCreateLogger,
  format,
  transports,
  Logger as LoggerWinston,
} from 'winston';
import dotenv from 'dotenv';
import { LOCAL_DB_LOGS_PATH, PROJECT_ROOT_PATH } from '@lp-system/config';
import { stringify } from './helpers.js';

// Ensure the logs directory exists immediately when logger is loaded.
try {
  fs.mkdirSync(LOCAL_DB_LOGS_PATH, { recursive: true });
} catch (error) {
  console.error(
    `[logger-init] Failed to create logs directory at ${LOCAL_DB_LOGS_PATH}:`,
    error
  );
}

const isDocker = (process.env.DOCKER_ENV || 'false').toLowerCase() === 'true';
dotenv.config({ path: path.join(PROJECT_ROOT_PATH, '.env'), override: !isDocker });

const customFormat = format.printf(({ level, label, message, timestamp }) => {
  return `${timestamp} [${label}] ${level.toUpperCase()}: ${message}`;
});

/**
 * Processes multiple logging arguments (including errors, nested objects, Maps, and Sets)
 * and returns a single concatenated human-readable string.
 */
function processArguments(arguments_: unknown[]): string {
  return arguments_
    .map((argument) => {
      if (argument instanceof Map || argument instanceof Set) {
        return stringify(argument);
      }

      if (typeof argument === 'object' && argument !== null) {
        if (argument instanceof Error) {
          try {
            return JSON.stringify(
              {
                ...argument,
                message: argument.message,
                stack: argument.stack,
              },
              null,
              1
            );
          } catch {
            return String(argument);
          }
        }
        return stringify(argument);
      }

      try {
        return stringify(argument);
      } catch {
        return String(argument);
      }
    })
    .join(' ');
}

export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
export const LOG_FILE_LEVEL = process.env.LOG_FILE_LEVEL || 'debug';

/**
 * Creates or retrieves a Winston Logger configured to log both to the console
 * and to specific log files within the dynamic logs directory path.
 *
 * @param {string} serviceName - Name of the service/module requesting the logger.
 * @returns {LoggerWinston} Winston logger instance with overridden leveled logging methods.
 */
export const getLogger = (serviceName: string): LoggerWinston => {
  const logger = winstonCreateLogger({
    level: LOG_LEVEL,
    format: format.combine(
      format.label({ label: serviceName }),
      format.timestamp({ format: 'HH:mm:ss.SSS' }),
      customFormat
    ),
    transports: [
      new transports.Console({ level: LOG_LEVEL }),
      new transports.File({
        level: LOG_FILE_LEVEL,
        filename: path.join(LOCAL_DB_LOGS_PATH, 'all-logger.log'),
      }),
      new transports.File({
        level: LOG_FILE_LEVEL,
        filename: path.join(LOCAL_DB_LOGS_PATH, `${serviceName}.log`),
      }),
    ],
  });

  // Override leveled methods to handle multiple arguments seamlessly
  const levels: Array<'info' | 'warn' | 'error' | 'debug'> = [
    'info',
    'warn',
    'error',
    'debug',
  ];
  for (const level of levels) {
    const originalMethod = logger[level].bind(logger);
    logger[level] = (...arguments_: unknown[]) => {
      const message = processArguments(arguments_);
      return originalMethod(message);
    };
  }

  return logger;
};
export type Logger = LoggerWinston;
export { LoggerWinston };
