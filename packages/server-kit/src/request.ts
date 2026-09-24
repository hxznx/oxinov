import type { Request } from 'express';

/** Request fields every Oxinov API relies on. Applications extend this with their own user type. */
export interface KitRequest extends Request {
  requestId: string;
  user?: unknown;
  /** Set by tenant-scoped products after membership is verified; logged for tracing only. */
  tenant?: { tenantId: string };
}

/** Matched Express route pattern, or undefined when no handler matched. `req.route` is untyped. */
export function routePath(request: Request): string | undefined {
  const route: unknown = request.route;
  if (typeof route !== 'object' || route === null) return undefined;
  const path: unknown = (route as { path?: unknown }).path;
  return typeof path === 'string' ? path : undefined;
}

/** A single path parameter; Express 5 types allow arrays for wildcard segments, which we reject. */
export function pathParam(request: Request, name: string): string | undefined {
  const value: unknown = request.params[name];
  return typeof value === 'string' ? value : undefined;
}

/** Full request path. Inside Nest middleware `request.path` is relative to the mount point. */
export function fullPath(request: Request): string {
  return request.originalUrl.split('?')[0] ?? '/';
}
