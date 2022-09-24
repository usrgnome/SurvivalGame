import { createLogger, format, transports, LoggerOptions } from 'winston'

const myFormat = format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`
})

export const logger = createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), myFormat),
    defaultMeta: { service: 'user-service' },
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new transports.File({ filename: './logs/error.log', level: 'error' }),
        new transports.File({ filename: './logs/combined.log' }),
    ],
})

export const clientDebugLogger = createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), myFormat),
    defaultMeta: { service: 'user-service' },
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new transports.File({ filename: './logs/clientDebugLog.log' }),
    ],
})

export const loggerLevel = {
    error: 'error',
    warn: 'warn',
    info: 'info',
    http: 'http',
    verbose: 'verbose',
    debug: 'debug',
    silly: 'silly',
}

if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new transports.Console({
            format: format.simple(),
        })
    )

    clientDebugLogger.add(
        new transports.Console({
            format: format.simple(),
        })
    )
}
