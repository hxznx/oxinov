#!/usr/bin/env node
// Sign-in smoke test for the local identity stack (Keycloak + Mailpit), without a browser.
// Walks the real customer flow through the Oxinov theme: unknown email, the six-digit code from Mailpit, a wrong
// code, the right code, and the redirect back to the portal with its state. With CLIENT_SECRET it also exchanges
// the code and checks the token's audience and lifetime. The first run creates the smoke account through the
// registration page and its emailed confirmation link.
// FR-ID-2202 (email code), FR-ID-2204 (no passwords), FR-ID-2207 (per-product audience), FR-ID-2208 (token life).
//
//   node devops/keycloak/signin-smoke.mjs
//   CLIENT_SECRET=... node devops/keycloak/signin-smoke.mjs     # also checks the token
//
// Local only: it reads codes from Mailpit, so it cannot run against production.
import { createHash, randomBytes } from 'node:crypto';

const issuer = (process.env.OIDC_ISSUER ?? 'http://localhost:8080/realms/oxinov').replace(/\/$/, '');
const clientId = process.env.OIDC_CLIENT_ID ?? 'oxinov-platform-web';
const redirectUri = process.env.REDIRECT_URI ?? 'http://localhost:3001/auth/callback';
const audience = process.env.EXPECTED_AUDIENCE ?? 'oxinov-platform-api';
const mailpit = (process.env.MAILPIT_URL ?? 'http://localhost:8025').replace(/\/$/, '');
const email = process.env.SMOKE_EMAIL ?? 'signin-smoke@oxinov.test';
const clientSecret = process.env.CLIENT_SECRET;

if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(`${issuer}/`)) {
  console.error(`Refusing to run against ${issuer}: this test is for the local identity stack only.`);
  process.exit(2);
}

const cookies = new Map();
const b64url = (buffer) => buffer.toString('base64url');
const decode = (html) => html.replaceAll('&amp;', '&').replaceAll('&#x3D;', '=').replaceAll('&#61;', '=');
const steps = [];
const pass = (name) => {
  steps.push(name);
  console.log(`ok   ${name}`);
};
const fail = (name, detail) => {
  console.error(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  process.exit(1);
};

async function http(url, init = {}) {
  const headers = new Headers(init.headers);
  if (cookies.size) headers.set('cookie', [...cookies].map(([k, v]) => `${k}=${v}`).join('; '));
  const response = await fetch(url, { ...init, headers, redirect: 'manual' });
  for (const line of response.headers.getSetCookie()) {
    const [pair] = line.split(';');
    const index = pair.indexOf('=');
    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (/max-age=0|expires=thu, 01 jan 1970/i.test(line) || value === '') cookies.delete(name);
    else cookies.set(name, value);
  }
  return response;
}

/** Follows redirects within Keycloak; stops (without following) at the app's redirect URI. */
async function follow(response) {
  let current = response;
  for (let hop = 0; hop < 10 && current.status >= 300 && current.status < 400; hop += 1) {
    const location = new URL(current.headers.get('location'), current.url || issuer).toString();
    if (location.startsWith(redirectUri)) return { redirectedTo: location };
    current = await http(location);
  }
  return { response: current, html: await current.text() };
}

const formAction = (html, id) => {
  const match = new RegExp(`<form[^>]*id="${id}"[^>]*action="([^"]+)"`).exec(html) ?? new RegExp(`<form[^>]*action="([^"]+)"[^>]*id="${id}"`).exec(html);
  return match ? decode(match[1]) : null;
};
const post = (action, fields) =>
  http(action, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fields) }).then(follow);

async function latestMail(to, since, pattern) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const list = await (await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}&limit=5`)).json();
    for (const summary of list.messages ?? []) {
      if (new Date(summary.Created).getTime() < since) continue;
      const message = await (await fetch(`${mailpit}/api/v1/message/${summary.ID}`)).json();
      const found = pattern.exec(message.Text ?? '');
      if (found) return { message, found: found[1] ?? found[0] };
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return null;
}

async function startAuthorization(extra = {}) {
  const verifier = b64url(randomBytes(48));
  const state = b64url(randomBytes(16));
  const url = new URL(`${issuer}/protocol/openid-connect/auth`);
  url.search = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: redirectUri,
    state,
    nonce: b64url(randomBytes(16)),
    code_challenge: b64url(createHash('sha256').update(verifier).digest()),
    code_challenge_method: 'S256',
    ...extra,
  }).toString();
  const page = await follow(await http(url));
  return { ...page, verifier, state };
}

// 1. The branded, passwordless sign-in page.
let auth = await startAuthorization();
if (!auth.html) fail('sign-in page', 'no page returned');
if (!/Sign in to Oxinov/.test(auth.html) || !/oxinov\.css/.test(auth.html)) fail('sign-in page uses the Oxinov theme');
if (/type="password"/.test(auth.html)) fail('sign-in page has no password field');
pass('sign-in page uses the Oxinov theme and has no password field');

// 2. An unknown email is refused with the Oxinov message.
let page = await post(formAction(auth.html, 'kc-form-login'), { username: `nobody-${Date.now()}@oxinov.test` });
if (!/could not find an Oxinov account/.test(page.html ?? '')) fail('unknown email is refused');
pass('unknown email is refused with a clear message');

// 3. The smoke account signs in with the emailed code (created through registration on the first run).
let since = Date.now() - 1000;
page = await post(formAction(page.html, 'kc-form-login'), { username: email });
if (/could not find an Oxinov account/.test(page.html ?? '')) {
  auth = await startAuthorization({ prompt: 'create' });
  if (!/Create your Oxinov account/.test(auth.html ?? '')) fail('registration page');
  since = Date.now() - 1000;
  page = await post(formAction(auth.html, 'kc-register-form'), { email, firstName: 'Signin', lastName: 'Smoke' });
  if (!/Confirm your email/.test(page.html ?? '')) fail('registration asks to confirm the email');
  const mail = await latestMail(email, since, /(https?:\/\/\S+action-token\S+)/);
  if (!mail) fail('confirmation email arrives');
  page = await follow(await http(decode(mail.found)));
  if (!page.redirectedTo) fail('confirmation link completes registration', page.html?.slice(0, 200));
  pass('first run: account created and email confirmed through the emailed link');
  // Registration signed this "browser" in; start again as a new browser so the code step is exercised.
  cookies.clear();
  auth = await startAuthorization();
  since = Date.now() - 1000;
  page = await post(formAction(auth.html, 'kc-form-login'), { username: email });
}
if (!/Check your email/.test(page.html ?? '')) fail('code page is shown', page.html?.slice(0, 200));
const codeMail = await latestMail(email, since, /\b(\d{6})\b/);
if (!codeMail) fail('code email arrives');
if (!/Your Oxinov sign-in code/.test(codeMail.message.Subject)) fail('code email subject', codeMail.message.Subject);
pass('six-digit code arrives in an Oxinov email');

const codeAction = formAction(page.html, 'kc-otp-login-form');
const wrong = codeMail.found === '000000' ? '111111' : '000000';
page = await post(codeAction, { 'email-otp': wrong, login: '' });
if (!/That code is not right/.test(page.html ?? '')) fail('a wrong code is refused');
pass('a wrong code is refused');

page = await post(formAction(page.html, 'kc-otp-login-form'), { 'email-otp': codeMail.found, login: '' });
if (!page.redirectedTo) fail('the right code signs in', page.html?.slice(0, 200));
const back = new URL(page.redirectedTo);
if (back.searchParams.get('state') !== auth.state || !back.searchParams.get('code')) fail('redirect carries code and state');
pass('the right code returns to the app with the authorization code and state');

// 4. Optional: the token is for this product only and short-lived.
if (clientSecret) {
  const token = await fetch(`${issuer}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: back.searchParams.get('code'),
      redirect_uri: redirectUri,
      code_verifier: auth.verifier,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!token.ok) fail('token exchange', String(token.status));
  const body = await token.json();
  const claims = JSON.parse(Buffer.from(body.access_token.split('.')[1], 'base64url').toString());
  const audiences = [].concat(claims.aud ?? []);
  if (!audiences.includes(audience)) fail('token audience', audiences.join(','));
  if (body.expires_in > 900) fail('access token lasts 15 minutes or less', String(body.expires_in));
  if (claims.email !== email || claims.email_verified !== true) fail('token carries the verified email');
  pass(`token for ${audience}, ${body.expires_in} seconds, verified email`);
} else {
  console.log('skip token check (set CLIENT_SECRET to include it)');
}

console.log(`\nSign-in smoke test passed (${steps.length} checks).`);
