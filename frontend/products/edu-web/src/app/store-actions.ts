'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi } from '@/lib/edu-api.ts';
import { PLAN_PERIODS, parseNpr, type PlanPeriod, type UploadTicket } from '@/lib/store.ts';

/**
 * Oxinov store actions (ADR-028): bank QR checkout, receipt upload and submission, payment review,
 * plans, settings, and coupons. Every rule is enforced by the Edu API; these actions only check input
 * shape and pass the signed-in person's token.
 */

export interface StoreFormState {
  error?: string;
  ok?: string;
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const STALE = 'This page is out of date. Reload and try again.';

const message = (error: unknown): string =>
  error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Try again shortly.';

const field = (form: FormData, name: string): string => String(form.get(name) ?? '').trim();

async function session(returnTo: string): Promise<string> {
  const current = await auth.currentSession(returnTo);
  if (!current) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  return current.accessToken;
}

// Learners ---------------------------------------------------------------------------------------

/** FR-CATALOG-305/307: starts a bank QR checkout for one plan and opens its payment page. */
export async function startBankCheckout(_: StoreFormState, form: FormData): Promise<StoreFormState> {
  const [slug, tenantId, courseId] = [field(form, 'slug'), field(form, 'tenantId'), field(form, 'courseId')];
  const period = field(form, 'period') as PlanPeriod;
  if (!SLUG.test(slug) || !UUID.test(tenantId) || !UUID.test(courseId)) return { error: STALE };
  if (!PLAN_PERIODS.includes(period)) return { error: 'Choose a plan.' };
  const couponCode = field(form, 'couponCode');
  const token = await session(`/w/${slug}/courses/${courseId}`);
  let paymentId: string;
  try {
    ({ payment: { id: paymentId } } = await eduApi.startBankQr(token, tenantId, courseId, { period, ...(couponCode ? { couponCode } : {}) }));
  } catch (error) {
    return { error: message(error) };
  }
  redirect(`/w/${slug}/pay/bank/${paymentId}`);
}

/** Step 1 of a receipt upload: a signed URL the browser sends the file to directly. */
export async function requestEvidenceUpload(input: { tenantId: string; paymentId: string; contentType: string; sizeBytes: number }): Promise<Result<UploadTicket>> {
  if (!UUID.test(input.tenantId) || !UUID.test(input.paymentId)) return { ok: false, error: STALE };
  const current = await auth.currentSession('/');
  if (!current) return { ok: false, error: 'Your session ended. Sign in again.' };
  try {
    return { ok: true, value: await eduApi.evidenceUpload(current.accessToken, input.tenantId, input.paymentId, { contentType: input.contentType, sizeBytes: input.sizeBytes }) };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

/** Step 2: sends the uploaded receipt and the bank transaction ID for review. */
export async function submitBankPayment(input: { slug: string; tenantId: string; paymentId: string; bankTransactionId: string }): Promise<Result<null>> {
  if (!SLUG.test(input.slug) || !UUID.test(input.tenantId) || !UUID.test(input.paymentId)) return { ok: false, error: STALE };
  const txId = input.bankTransactionId.trim();
  if (txId.length < 4) return { ok: false, error: 'Enter the transaction ID from your bank receipt.' };
  const current = await auth.currentSession('/');
  if (!current) return { ok: false, error: 'Your session ended. Sign in again.' };
  try {
    await eduApi.submitBankPayment(current.accessToken, input.tenantId, input.paymentId, txId);
  } catch (error) {
    return { ok: false, error: message(error) };
  }
  revalidatePath(`/w/${input.slug}/pay/bank/${input.paymentId}`);
  return { ok: true, value: null };
}

// Administrators --------------------------------------------------------------------------------

/** FR-MGMT-1403: approve or reject a bank QR payment. */
export async function reviewPayment(_: StoreFormState, form: FormData): Promise<StoreFormState> {
  const [slug, tenantId, paymentId, decision] = [field(form, 'slug'), field(form, 'tenantId'), field(form, 'paymentId'), field(form, 'decision')];
  if (!SLUG.test(slug) || !UUID.test(tenantId) || !UUID.test(paymentId)) return { error: STALE };
  const reason = field(form, 'reason');
  if (decision === 'reject' && reason.length < 5) return { error: 'Write a reason of at least 5 characters. The learner sees it.' };
  if (decision !== 'approve' && decision !== 'reject') return { error: STALE };
  const token = await session(`/w/${slug}/store/payments`);
  try {
    if (decision === 'approve') await eduApi.approvePayment(token, tenantId, paymentId);
    else await eduApi.rejectPayment(token, tenantId, paymentId, reason);
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath(`/w/${slug}/store/payments`);
  return { ok: decision === 'approve' ? 'Approved. The course is unlocked and the thank-you email is on its way.' : 'Rejected. The learner was told the reason.' };
}

/** FR-CATALOG-305: the owner sets each plan's price and whether it is on sale. */
export async function savePlans(_: StoreFormState, form: FormData): Promise<StoreFormState> {
  const [slug, tenantId, courseId] = [field(form, 'slug'), field(form, 'tenantId'), field(form, 'courseId')];
  if (!SLUG.test(slug) || !UUID.test(tenantId) || !UUID.test(courseId)) return { error: STALE };
  const plans: { period: PlanPeriod; priceMinor: number; active: boolean }[] = [];
  for (const period of PLAN_PERIODS) {
    const price = parseNpr(field(form, `price-${period}`));
    const active = form.get(`active-${period}`) === 'on';
    if (price === null) {
      if (active) return { error: 'Every plan on sale needs a price in rupees, for example 15000.' };
      continue;
    }
    if (price < 1000) return { error: 'Prices start at NPR 10.' };
    plans.push({ period, priceMinor: price, active });
  }
  const token = await session(`/w/${slug}/teach/${courseId}/plans`);
  try {
    await eduApi.setPlans(token, tenantId, courseId, plans);
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath(`/w/${slug}/teach/${courseId}/plans`);
  return { ok: 'Plans saved. New checkouts use these prices; open checkouts keep theirs.' };
}

/** FR-MGMT-1408: payment details, review time, help contact, refund policy, and default prices. */
export async function saveStoreSettings(_: StoreFormState, form: FormData): Promise<StoreFormState> {
  const [slug, tenantId] = [field(form, 'slug'), field(form, 'tenantId')];
  if (!SLUG.test(slug) || !UUID.test(tenantId)) return { error: STALE };
  const body: Record<string, unknown> = {};
  for (const name of ['accountName', 'accountNumber', 'bankName', 'reviewTimeText', 'helpContact', 'refundPolicy', 'referencePrefix']) {
    const value = field(form, name);
    if (value) body[name] = value;
  }
  for (const [name, period] of [['defaultMonth1Minor', 'MONTH_1'], ['defaultMonth6Minor', 'MONTH_6'], ['defaultYear1Minor', 'YEAR_1'], ['defaultLifetimeMinor', 'LIFETIME']] as const) {
    const raw = field(form, `default-${period}`);
    if (!raw) continue;
    const minor = parseNpr(raw);
    if (minor === null || minor < 1000) return { error: 'Default prices must be at least NPR 10.' };
    body[name] = minor;
  }
  const token = await session(`/w/${slug}/store/settings`);
  try {
    await eduApi.updateStoreSettings(token, tenantId, body);
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath(`/w/${slug}/store/settings`);
  return { ok: 'Settings saved.' };
}

export async function requestQrUpload(input: { tenantId: string; contentType: string; sizeBytes: number }): Promise<Result<UploadTicket>> {
  if (!UUID.test(input.tenantId)) return { ok: false, error: STALE };
  const current = await auth.currentSession('/');
  if (!current) return { ok: false, error: 'Your session ended. Sign in again.' };
  try {
    return { ok: true, value: await eduApi.qrUpload(current.accessToken, input.tenantId, { contentType: input.contentType, sizeBytes: input.sizeBytes }) };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

export async function completeQrUpload(input: { slug: string; tenantId: string; uploadId: string; contentType: string }): Promise<Result<null>> {
  if (!SLUG.test(input.slug) || !UUID.test(input.tenantId) || !UUID.test(input.uploadId)) return { ok: false, error: STALE };
  const current = await auth.currentSession('/');
  if (!current) return { ok: false, error: 'Your session ended. Sign in again.' };
  try {
    await eduApi.qrComplete(current.accessToken, input.tenantId, { uploadId: input.uploadId, contentType: input.contentType });
  } catch (error) {
    return { ok: false, error: message(error) };
  }
  revalidatePath(`/w/${input.slug}/store/settings`);
  return { ok: true, value: null };
}

/** FR-CATALOG-317: a percentage or fixed-amount coupon, optionally limited by plan, dates, and uses. */
export async function createCoupon(_: StoreFormState, form: FormData): Promise<StoreFormState> {
  const [slug, tenantId] = [field(form, 'slug'), field(form, 'tenantId')];
  if (!SLUG.test(slug) || !UUID.test(tenantId)) return { error: STALE };
  const code = field(form, 'code').toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9-]{2,39}$/.test(code)) return { error: 'Use 3–40 letters, numbers, or hyphens for the code, for example DASHAIN25.' };
  const kind = field(form, 'kind');
  const amount = field(form, 'amount');
  const body: Record<string, unknown> = { code };
  if (kind === 'percent') {
    const percent = Number(amount);
    if (!Number.isInteger(percent) || percent < 1 || percent > 100) return { error: 'A percentage discount is a whole number from 1 to 100.' };
    body.percentOff = percent;
  } else {
    const minor = parseNpr(amount);
    if (minor === null) return { error: 'Enter the discount in rupees, for example 1000.' };
    body.amountOffMinor = minor;
  }
  const period = field(form, 'period');
  if (period && (PLAN_PERIODS as readonly string[]).includes(period)) body.period = period;
  const maxUses = field(form, 'maxUses');
  if (maxUses) {
    const uses = Number(maxUses);
    if (!Number.isInteger(uses) || uses < 1) return { error: 'The use limit is a whole number, or leave it empty for no limit.' };
    body.maxUses = uses;
  }
  const endsAt = field(form, 'endsAt');
  if (endsAt) body.endsAt = new Date(`${endsAt}T23:59:59+05:45`).toISOString();
  const token = await session(`/w/${slug}/store/settings`);
  try {
    await eduApi.createCoupon(token, tenantId, body);
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath(`/w/${slug}/store/settings`);
  return { ok: `Coupon ${code} created.` };
}

export async function toggleCoupon(_: StoreFormState, form: FormData): Promise<StoreFormState> {
  const [slug, tenantId, couponId] = [field(form, 'slug'), field(form, 'tenantId'), field(form, 'couponId')];
  if (!SLUG.test(slug) || !UUID.test(tenantId) || !UUID.test(couponId)) return { error: STALE };
  const token = await session(`/w/${slug}/store/settings`);
  try {
    await eduApi.setCouponActive(token, tenantId, couponId, field(form, 'active') === 'true');
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath(`/w/${slug}/store/settings`);
  return {};
}
