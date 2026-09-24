/** Nest injection tokens shared by every Oxinov API. */
export const APP_CONFIG = Symbol('APP_CONFIG');
export const LOGGER = Symbol('LOGGER');
export const JWKS_RESOLVER = Symbol('JWKS_RESOLVER');
export const SECURITY_EVENT_SINK = Symbol('SECURITY_EVENT_SINK');
/** Provider that maps a verified token identity to the application's user record. */
export const IDENTITY_RESOLVER = Symbol('IDENTITY_RESOLVER');
