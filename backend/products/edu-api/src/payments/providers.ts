import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentsConfig } from '../config/app-config';

export type ProviderName = 'KHALTI' | 'ESEWA';

/** Where to send the learner to pay: a link (Khalti) or a form the browser posts (eSewa). */
export type PaymentRedirect =
  | { method: 'GET'; url: string }
  | { method: 'POST'; url: string; fields: Record<string, string> };

export interface CheckoutRequest {
  paymentId: string;
  amountMinor: number;
  courseTitle: string;
  returnUrl: string;
  failureUrl: string;
  websiteUrl: string;
}

export interface CheckoutStart {
  /** The provider's reference for this checkout: Khalti's pidx, or our transaction UUID for eSewa. */
  providerPaymentId: string;
  redirect: PaymentRedirect;
}

/**
 * The provider's answer when the server asks about a payment. Only COMPLETED with the expected amount
 * grants access (FR-PAY-2701); PENDING is asked again later; FAILED ends the payment.
 */
export type VerifyResult =
  | { status: 'COMPLETED'; amountMinor: number; transactionId: string }
  | { status: 'PENDING'; detail: string }
  | { status: 'FAILED'; detail: string };

export interface VerifyRequest {
  paymentId: string;
  providerPaymentId: string;
  amountMinor: number;
  createdAt: Date;
}

export interface PaymentProvider {
  readonly name: ProviderName;
  start(request: CheckoutRequest): Promise<CheckoutStart>;
  verify(request: VerifyRequest): Promise<VerifyResult>;
}

/** Nest injection token for the enabled providers, so tests can substitute fakes for the real APIs. */
export const PAYMENT_PROVIDERS = Symbol('PAYMENT_PROVIDERS');
export type PaymentProviders = ReadonlyMap<ProviderName, PaymentProvider>;

/** Provider calls give up quickly; the learner can check again, and nothing is granted without an answer. */
const TIMEOUT_MS = 15_000;

export class ProviderError extends Error {}

async function callJson(url: string, init: RequestInit): Promise<{ status: number; body: unknown }> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    throw new ProviderError(`request failed: ${(error as Error).name}`);
  }
  const text = await response.text();
  try {
    return { status: response.status, body: text ? JSON.parse(text) : {} };
  } catch {
    throw new ProviderError(`HTTP ${response.status} with a non-JSON body`);
  }
}

const field = (body: unknown, key: string): unknown =>
  body !== null && typeof body === 'object' ? (body as Record<string, unknown>)[key] : undefined;

// --- Khalti ePayment (https://docs.khalti.com/khalti-epayment/) ------------------------------------

/** Khalti refuses payments under Rs 10. */
export const KHALTI_MIN_AMOUNT_MINOR = 1000;

export class KhaltiProvider implements PaymentProvider {
  readonly name = 'KHALTI' as const;

  constructor(private readonly config: { secretKey: string; apiUrl: string }) {}

  private headers() {
    return { Authorization: `Key ${this.config.secretKey}`, 'Content-Type': 'application/json' };
  }

  async start(request: CheckoutRequest): Promise<CheckoutStart> {
    const { status, body } = await callJson(`${this.config.apiUrl}/epayment/initiate/`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        return_url: request.returnUrl,
        website_url: request.websiteUrl,
        amount: request.amountMinor, // paisa
        purchase_order_id: request.paymentId,
        purchase_order_name: request.courseTitle.slice(0, 100),
      }),
    });
    const pidx = field(body, 'pidx');
    const url = field(body, 'payment_url');
    if (status !== 200 || typeof pidx !== 'string' || typeof url !== 'string' || !url.startsWith('https://')) {
      throw new ProviderError(`Khalti initiate returned HTTP ${status}`);
    }
    return { providerPaymentId: pidx, redirect: { method: 'GET', url } };
  }

  async verify(request: VerifyRequest): Promise<VerifyResult> {
    const { status, body } = await callJson(`${this.config.apiUrl}/epayment/lookup/`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ pidx: request.providerPaymentId }),
    });
    // Khalti answers 400 for Expired and User canceled, with the status in the body.
    if (status !== 200 && !(status === 400 && typeof field(body, 'status') === 'string')) {
      throw new ProviderError(`Khalti lookup returned HTTP ${status}`);
    }
    return khaltiResult(body);
  }
}

/** Maps a Khalti lookup response; exported for unit tests. */
export function khaltiResult(body: unknown): VerifyResult {
  const state = field(body, 'status');
  switch (state) {
    case 'Completed': {
      const amount = field(body, 'total_amount');
      const transactionId = field(body, 'transaction_id');
      if (!Number.isInteger(amount) || typeof transactionId !== 'string' || !transactionId) {
        return { status: 'PENDING', detail: 'Khalti reported Completed without an amount or transaction ID' };
      }
      return { status: 'COMPLETED', amountMinor: amount as number, transactionId };
    }
    case 'Pending':
    case 'Initiated':
      return { status: 'PENDING', detail: `Khalti status ${state}` };
    case 'Expired':
    case 'User canceled':
    case 'Refunded':
    case 'Partially Refunded':
      return { status: 'FAILED', detail: `Khalti status ${state}` };
    default:
      return { status: 'PENDING', detail: `Khalti status ${String(state)}` };
  }
}

// --- eSewa ePay v2 (https://developer.esewa.com.np/) -------------------------------------------------

/** eSewa amounts are rupees as text; the same text must be signed and sent. */
export function esewaAmount(amountMinor: number): string {
  return amountMinor % 100 === 0 ? String(amountMinor / 100) : (amountMinor / 100).toFixed(2);
}

/** HMAC-SHA256 over `name=value` pairs of the signed fields, in order, base64 encoded. */
export function esewaSignature(secretKey: string, fields: Record<string, string>, names: string[]): string {
  const message = names.map((name) => `${name}=${fields[name] ?? ''}`).join(',');
  return createHmac('sha256', secretKey).update(message).digest('base64');
}

export function esewaSignatureValid(secretKey: string, fields: Record<string, string>, names: string[], signature: string): boolean {
  const expected = Buffer.from(esewaSignature(secretKey, fields, names));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** eSewa answers NOT_FOUND for a checkout the learner abandoned; after this long it counts as failed. */
const ESEWA_ABANDONED_MS = 60 * 60 * 1000;

export class EsewaProvider implements PaymentProvider {
  readonly name = 'ESEWA' as const;

  constructor(private readonly config: { productCode: string; secretKey: string; formUrl: string; statusUrl: string }) {}

  start(request: CheckoutRequest): Promise<CheckoutStart> {
    const amount = esewaAmount(request.amountMinor);
    const fields: Record<string, string> = {
      amount,
      tax_amount: '0',
      total_amount: amount,
      transaction_uuid: request.paymentId,
      product_code: this.config.productCode,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: request.returnUrl,
      failure_url: request.failureUrl,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
    };
    fields.signature = esewaSignature(this.config.secretKey, fields, ['total_amount', 'transaction_uuid', 'product_code']);
    return Promise.resolve({ providerPaymentId: request.paymentId, redirect: { method: 'POST', url: this.config.formUrl, fields } });
  }

  async verify(request: VerifyRequest): Promise<VerifyResult> {
    const query = new URLSearchParams({
      product_code: this.config.productCode,
      total_amount: esewaAmount(request.amountMinor),
      transaction_uuid: request.providerPaymentId,
    });
    const { status, body } = await callJson(`${this.config.statusUrl}?${query.toString()}`, { method: 'GET' });
    if (status !== 200) throw new ProviderError(`eSewa status returned HTTP ${status}`);
    return esewaResult(body, request, Date.now());
  }
}

/** Maps an eSewa status response; exported for unit tests. */
export function esewaResult(body: unknown, request: VerifyRequest, now: number): VerifyResult {
  const state = field(body, 'status');
  switch (state) {
    case 'COMPLETE': {
      const total = Number(field(body, 'total_amount'));
      const refId = field(body, 'ref_id');
      if (field(body, 'transaction_uuid') !== request.providerPaymentId || !Number.isFinite(total) || typeof refId !== 'string' || !refId) {
        return { status: 'PENDING', detail: 'eSewa reported COMPLETE for a different or incomplete transaction' };
      }
      return { status: 'COMPLETED', amountMinor: Math.round(total * 100), transactionId: refId };
    }
    case 'PENDING':
    case 'AMBIGUOUS':
      return { status: 'PENDING', detail: `eSewa status ${state}` };
    case 'NOT_FOUND':
      return now - request.createdAt.getTime() > ESEWA_ABANDONED_MS
        ? { status: 'FAILED', detail: 'eSewa has no record of this payment' }
        : { status: 'PENDING', detail: 'eSewa status NOT_FOUND' };
    case 'CANCELED':
    case 'FULL_REFUND':
    case 'PARTIAL_REFUND':
      return { status: 'FAILED', detail: `eSewa status ${state}` };
    default:
      return { status: 'PENDING', detail: `eSewa status ${String(state)}` };
  }
}

export function providersFromConfig(config: PaymentsConfig): PaymentProviders {
  const providers = new Map<ProviderName, PaymentProvider>();
  if (config.khalti) providers.set('KHALTI', new KhaltiProvider(config.khalti));
  if (config.esewa) providers.set('ESEWA', new EsewaProvider(config.esewa));
  return providers;
}
