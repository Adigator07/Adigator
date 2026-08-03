import { env } from "@/app/lib/config/env";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel = (env.logging.level || "info").toLowerCase() as LogLevel;

function shouldLog(level: LogLevel) {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[configuredLevel];
}

function formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const payload = context ? ` ${JSON.stringify(context)}` : "";
  return `[Adigator:${level.toUpperCase()}] ${message}${payload}`;
}

function write(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (!env.logging.enabled || !shouldLog(level)) {
    return;
  }

  const formatted = formatMessage(level, message, context);

  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "info":
      console.info(formatted);
      break;
    default:
      console.debug(formatted);
      break;
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => write("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => write("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => write("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => write("error", message, context),
};

export function logError(error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : "Unknown error";
  logger.error(message, { ...context, stack: error instanceof Error ? error.stack : undefined });
}
