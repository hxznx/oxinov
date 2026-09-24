import type { LoggerService } from '@nestjs/common';

type Level = 'debug' | 'info' | 'warn' | 'error';

// Keys whose values must never reach logs (docs/engineering/LOGGING.md).
const REDACTED_KEYS = /^(password|token|secret|authorization|cookie|prompt|answer|response|card|code|phone)/i;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    output[key] = REDACTED_KEYS.test(key) ? '[REDACTED]' : redact(child, depth + 1);
  }
  return output;
}

/** Structured JSON logs with service, environment, and version on every line. */
export class JsonLogger implements LoggerService {
  constructor(
    private readonly base: { service: string; environment: string; version: string },
    private readonly write: (line: string) => void = (line) => process.stdout.write(`${line}\n`),
  ) {}

  log(message: unknown, ...rest: unknown[]): void {
    this.emit('info', message, rest);
  }
  error(message: unknown, ...rest: unknown[]): void {
    this.emit('error', message, rest);
  }
  warn(message: unknown, ...rest: unknown[]): void {
    this.emit('warn', message, rest);
  }
  debug(message: unknown, ...rest: unknown[]): void {
    this.emit('debug', message, rest);
  }
  verbose(message: unknown, ...rest: unknown[]): void {
    this.emit('debug', message, rest);
  }

  /** Structured event with explicit fields, e.g. logger.event('info', 'request.completed', {...}). */
  event(level: Level, event: string, fields: Record<string, unknown> = {}): void {
    this.write(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        ...this.base,
        event,
        ...(redact(fields) as Record<string, unknown>),
      }),
    );
  }

  private emit(level: Level, message: unknown, rest: unknown[]): void {
    // Nest passes the context name as the last string argument.
    const context = typeof rest[rest.length - 1] === 'string' ? rest[rest.length - 1] : undefined;
    const fields: Record<string, unknown> = { context };
    if (message instanceof Error) {
      fields.message = message.message;
      fields.errorName = message.name;
    } else if (typeof message === 'object' && message !== null) {
      Object.assign(fields, message);
    } else {
      fields.message = String(message);
    }
    if (level === 'error' && typeof rest[0] === 'string' && rest.length > 1) {
      fields.stack = rest[0];
    }
    this.event(level, 'log', fields);
  }
}
