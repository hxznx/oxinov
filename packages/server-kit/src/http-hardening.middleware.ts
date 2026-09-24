import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import type { ServiceConfig } from './config';
import { fullPath, type KitRequest } from './request';
import { APP_CONFIG } from './tokens';

/**
 * Baseline response headers for a JSON API. The Swagger UI under /docs (local and CI only) needs
 * scripts and styles, so it keeps the default policy.
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(request: KitRequest, response: Response, next: NextFunction): void {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    if (!fullPath(request).startsWith('/docs')) {
      response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    }
    next();
  }
}

/**
 * Fixed-window request counter per client key. It protects one API instance from bursts; the edge
 * WAF rate rules protect the fleet, and a shared Redis limiter can replace this later.
 */
export class RateLimiter {
  private readonly windows = new Map<string, { startedAt: number; count: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs = 60_000,
    private readonly maxKeys = 50_000,
  ) {}

  /** Returns 0 when allowed, otherwise the seconds until the client may retry. */
  hit(key: string, now = Date.now()): number {
    let window = this.windows.get(key);
    if (!window || now - window.startedAt >= this.windowMs) {
      if (this.windows.size >= this.maxKeys) this.prune(now);
      window = { startedAt: now, count: 0 };
      this.windows.set(key, window);
    }
    window.count += 1;
    if (window.count <= this.limit) return 0;
    return Math.max(1, Math.ceil((window.startedAt + this.windowMs - now) / 1000));
  }

  private prune(now: number): void {
    for (const [key, window] of this.windows) {
      if (now - window.startedAt >= this.windowMs) this.windows.delete(key);
    }
    // Every key is still active: drop the oldest instead of growing without bound.
    if (this.windows.size >= this.maxKeys) {
      const oldest = this.windows.keys().next().value;
      if (oldest !== undefined) this.windows.delete(oldest);
    }
  }
}

/** Returns 429 RATE_LIMITED with Retry-After when a client exceeds RATE_LIMIT_PER_MINUTE. */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly limiter?: RateLimiter;

  constructor(@Inject(APP_CONFIG) config: ServiceConfig) {
    if (config.rateLimitPerMinute > 0) this.limiter = new RateLimiter(config.rateLimitPerMinute);
  }

  use(request: KitRequest, response: Response, next: NextFunction): void {
    // Probes and scrapes come from the platform itself and must never be throttled.
    const path = fullPath(request);
    if (!this.limiter || path.startsWith('/health/') || path === '/metrics') {
      next();
      return;
    }
    const retryAfter = this.limiter.hit(request.ip ?? 'unknown');
    if (retryAfter === 0) {
      next();
      return;
    }
    response.setHeader('Retry-After', String(retryAfter));
    response.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Try again shortly.',
        requestId: request.requestId,
      },
    });
  }
}
