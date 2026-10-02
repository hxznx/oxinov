/**
 * Server-side client for the Oxinov Edu API (backend/products/edu-api). The browser never calls it directly and never
 * sees tokens; every call carries the signed-in person's Edu access token. Types mirror the API DTOs.
 */
import type { BankCheckout, BankPayment, CheckoutInfo, Coupon, Plan, PlanPeriod, ReviewItem, StoreSettings, UploadTicket as StoreUploadTicket } from './store.ts';

export type TenantRole = 'LEARNER' | 'INSTRUCTOR' | 'ADMIN' | 'OWNER';

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  status: string;
  primaryColor: string | null;
  timeZone: string;
  defaultLocale: string;
  role: TenantRole;
}

export interface Price {
  amountMinor: number;
  currency: string;
}

export interface CourseSummary {
  id: string;
  slug: string;
  status: string;
  title: string;
  summary: string;
  price: Price;
  /** Sold through access plans (ADR-028): `price` is the cheapest plan, shown as "from". */
  hasPlans?: boolean;
  kind?: OfferingKind;
  category?: OfferingCategory;
  programId: string | null;
}

/** Paid-course checkout with Khalti and eSewa (ADR-023). */
export type PaymentProvider = 'KHALTI' | 'ESEWA';

export interface CheckoutOptions {
  available: boolean;
  providers: PaymentProvider[];
  amountMinor: number;
  currency: string;
  owned: boolean;
  reason?: string;
  mode: 'sandbox' | 'live';
}

export type PaymentRedirect =
  | { method: 'GET'; url: string }
  | { method: 'POST'; url: string; fields: Record<string, string> };

export interface Checkout {
  paymentId: string;
  provider: PaymentProvider;
  redirect: PaymentRedirect;
}

export interface Payment {
  id: string;
  courseId: string;
  provider: PaymentProvider;
  amountMinor: number;
  currency: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  transactionId: string | null;
  createdAt: string;
  verifiedAt: string | null;
}

/** Course certificates and progress (FR-PLAYER-402, FR-CERT-601/602). */
export interface Certificate {
  id: string;
  courseId: string;
  code: string;
  holderName: string;
  courseTitle: string;
  instructorName: string | null;
  schoolName: string;
  issuedAt: string;
  status: 'VALID' | 'REVOKED';
  revokedAt: string | null;
  revokeReason: string | null;
}

export interface CertificateVerification {
  code: string;
  holderName: string;
  courseTitle: string;
  schoolName: string;
  issuedAt: string;
  status: 'VALID' | 'REVOKED';
}

export interface CourseProgress {
  courseId: string;
  complete: boolean;
  requiredLessons: number;
  completedRequiredLessons: number;
  lessons: { id: string; title: string; kind: string; required: boolean; completed: boolean }[];
  exams: { id: string; title: string; passed: boolean }[];
  assignments: { id: string; title: string; passed: boolean }[];
  certificate: Certificate | null;
}

export interface LessonOutline {
  id: string;
  title: string;
  kind: string;
  isPreview: boolean;
  isRequired: boolean;
  durationSec: number | null;
}

export interface CourseDetail extends CourseSummary {
  description: string;
  language: string;
  outcomes: string[];
  version: number;
  curriculum: { id: string; title: string; lessons: LessonOutline[] }[];
  access: { entitled: boolean; canAuthor: boolean };
}

export interface LessonMedia {
  id: string;
  kind: 'VIDEO' | 'AUDIO';
  contentType: string;
  /** Short-lived signed playback URL. */
  url: string;
  durationSec: number | null;
  resumeSec: number;
  completed: boolean;
}

export interface LessonResource {
  id: string;
  kind: 'FILE' | 'LINK';
  title: string;
  url: string | null;
  file: { name: string; sizeBytes: number; contentType: string; downloadUrl: string; viewUrl: string | null } | null;
}

export type ContentSource = 'YOUTUBE' | 'GOOGLE_DRIVE';

export interface Lesson extends LessonOutline {
  bodyMarkdown: string;
  media: LessonMedia | null;
  /** View-only player address, returned only after the access check (ADR-028 point 5). */
  external: { source: ContentSource; embedUrl: string } | null;
  /** The viewer's email, drawn over external players. */
  watermark: string;
  /** Empty on free previews for people without course access. */
  resources: LessonResource[];
}

export interface UploadTicket {
  mediaId: string;
  uploadUrl: string;
  headers: Record<string, string>;
  expiresAt: string;
}

export interface MediaFile {
  id: string;
  kind: 'VIDEO' | 'AUDIO';
  status: 'UPLOADING' | 'READY' | 'FAILED';
  fileName: string;
  sizeBytes: number;
  durationSec: number | null;
}

export interface Enrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  status: string;
  enrolledAt: string;
  hasAccess: boolean;
}

export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK';
export type AnswerResponse = { choiceIds: string[] } | { text: string };

export interface ExamSummary {
  id: string;
  title: string;
  kind: string;
  timeLimitSec: number;
  passPercent: number;
  maxAttempts: number | null;
  attemptsUsed: number;
  inProgressAttemptId: string | null;
  sections: { sectionKey: string; title: string; questionCount: number }[];
}

export interface AttemptItem {
  id: string;
  position: number;
  sectionKey: string;
  type: QuestionType;
  prompt: string;
  passage: string | null;
  choices: { id: string; text: string }[];
  marks: number;
  response: AnswerResponse | null;
  /** Present after submission, subject to the exam's answer-release rule (FR-ASSESS-502). */
  isCorrect?: boolean | null;
  marksAwarded?: number | null;
  answerKey?: string[];
  explanation?: string | null;
}

export interface Attempt {
  id: string;
  examId: string;
  examTitle: string;
  attemptNumber: number;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED' | string;
  startedAt: string;
  deadlineAt: string;
  submittedAt: string | null;
  remainingSec: number;
  items: AttemptItem[];
  result: {
    score: number;
    maxScore: number;
    passed: boolean;
    sectionBreakdown: { sectionKey: string; title: string; score: number; maxScore: number }[];
    revision: number;
    notice: string;
  } | null;
}

export interface Invite {
  id: string;
  code: string;
  role: TenantRole;
  expiresAt: string;
  maxUses: number | null;
  useCount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'USED_UP' | 'REVOKED';
  createdAt: string;
}

export interface Member {
  userId: string;
  displayName: string | null;
  email: string | null;
  role: TenantRole;
  status: string;
  joinedAt: string;
}

export interface DraftLesson {
  id: string;
  title: string;
  kind: string;
  position: number;
  bodyMarkdown: string;
  isPreview: boolean;
  isRequired: boolean;
  durationSec: number | null;
  media: { id: string; status: string; fileName: string; durationSec: number | null } | null;
  /** YouTube or Google Drive source (ADR-028), with the ordinary link the author pasted. */
  external: { source: ContentSource; id: string; url: string } | null;
  resources: { id: string; kind: 'FILE' | 'LINK'; title: string; url: string | null; file: { name: string; sizeBytes: number; contentType: string } | null }[];
}

export interface Draft {
  courseId: string;
  versionId: string;
  version: number;
  status: 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED';
  courseStatus: string;
  title: string;
  summary: string;
  description: string;
  language: string;
  outcomes: string[];
  priceMinor: number;
  currency: string;
  reviewFeedback: string | null;
  submittedAt: string | null;
  hasPublishedVersion: boolean;
  canReview: boolean;
  sections: { id: string; title: string; position: number; lessons: DraftLesson[] }[];
}

export interface AuthoredCourse {
  courseId: string;
  title: string;
  courseStatus: string;
  draftStatus: 'DRAFT' | 'IN_REVIEW' | null;
  mine: boolean;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  passage: string | null;
  choices: { id: string; text: string }[];
  answerKey: string[];
  explanation: string | null;
  marks: number;
  version: number;
}

export interface QuizSection {
  id: string;
  sectionKey: string;
  title: string;
  position: number;
  questionCount: number;
  available: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  kind: 'PRACTICE' | 'MOCK';
  status: 'DRAFT' | 'APPROVED' | 'RETIRED';
  timeLimitMin: number;
  passPercent: number;
  maxAttempts: number | null;
  answerRelease: 'AFTER_SUBMIT' | 'NEVER';
  shuffleQuestions: boolean;
  attempts: number;
  editable: boolean;
  sections: QuizSection[];
  questions?: Record<string, QuizQuestion[]>;
}

export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'REVISION_REQUESTED' | 'PASSED' | 'FAILED';

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  instructions: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  dueAt: string | null;
  allowLate: boolean;
  acceptFile: boolean;
  acceptUrl: boolean;
  acceptText: boolean;
  maxFileMb: number;
  maxPoints: number | null;
  isRequired: boolean;
  counts?: { submitted: number; toGrade: number };
  myStatus?: SubmissionStatus | null;
}

export interface Revision {
  revision: number;
  text: string;
  url: string | null;
  file: { name: string; sizeBytes: number; downloadUrl: string | null } | null;
  submittedAt: string;
  late: boolean;
  outcome: SubmissionStatus | null;
  feedback: string | null;
  score: number | null;
  gradedAt: string | null;
}

export interface MySubmission {
  assignment: Assignment;
  status: SubmissionStatus;
  canEdit: boolean;
  draft: { text: string; url: string | null; file: { name: string; sizeBytes: number } | null };
  revisions: Revision[];
}

export interface SubmissionSummary {
  id: string;
  learner: { name: string | null; email: string | null };
  status: SubmissionStatus;
  revisions: number;
  lastSubmittedAt: string | null;
  late: boolean;
}

export interface SubmissionDetail {
  id: string;
  assignment: Assignment;
  learner: { name: string | null; email: string | null };
  status: SubmissionStatus;
  revisions: Revision[];
}

export interface Note {
  id: string;
  body: string;
  timestampSec: number | null;
  lessonTitle: string;
  /** The lesson in the current published version; null when the lesson was removed. */
  lessonId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StreamAuthor {
  name: string;
  /** Teaches this course or runs the school. */
  teacher: boolean;
}

export interface HiddenPost {
  reason: string;
  at: string;
}

export interface Announcement {
  id: string;
  body: string;
  author: StreamAuthor;
  createdAt: string;
  edited: boolean;
}

export interface Announcements {
  canPost: boolean;
  announcements: Announcement[];
}

export interface Answer {
  id: string;
  body: string;
  author: StreamAuthor;
  mine: boolean;
  votes: number;
  voted: boolean;
  accepted: boolean;
  hidden: HiddenPost | null;
  createdAt: string;
  edited: boolean;
}

export interface Question {
  id: string;
  /** The lesson in the current published version; null when the lesson was removed. */
  lessonId: string | null;
  lessonTitle: string;
  body: string;
  author: StreamAuthor;
  mine: boolean;
  acceptedAnswerId: string | null;
  canAccept: boolean;
  hidden: HiddenPost | null;
  createdAt: string;
  edited: boolean;
  answers: Answer[];
}

export interface Questions {
  /** The caller teaches the course and may hide posts. */
  canModerate: boolean;
  questions: Question[];
}

export class EduApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

let baseUrl: string | undefined;
function eduApiBaseUrl(): string {
  if (baseUrl) return baseUrl;
  const value = process.env.EDU_API_URL?.trim();
  if (!value) throw new Error('EDU_API_URL is required (see frontend/products/edu-web/.env.example)');
  return (baseUrl = value.replace(/\/$/, ''));
}

/** One video, file, or upload in the media library (FR-COURSE-210), with the lessons that use it. */
export type LibraryKind = 'YOUTUBE' | 'GOOGLE_DRIVE' | 'UPLOAD';

export interface LibraryItem {
  kind: LibraryKind;
  id: string;
  url: string | null;
  upload: { kind: 'VIDEO' | 'AUDIO'; status: 'UPLOADING' | 'READY' | 'FAILED'; fileName: string; sizeBytes: number; durationSec: number | null } | null;
  uses: { courseId: string; courseTitle: string; lessonId: string; lessonTitle: string; draft: boolean }[];
}

/** Free access grants (FR-MGMT-1404). */
export type GrantLength = 'DAYS_7' | 'MONTH_1' | 'MONTH_6' | 'YEAR_1' | 'LIFETIME';

export interface Grant {
  id: string;
  learnerName: string | null;
  learnerEmail: string | null;
  courseTitle: string;
  startsAt: string;
  endsAt: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  createdAt: string;
}

/** One line of the workspace audit log (design screen 22). */
export interface AuditEvent {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  actor: string | null;
  createdAt: string;
}

/** In-app notifications (FR-COMM-704). Mirrors backend/products/edu-api/src/notifications/notifications.dto.ts. */
export type NotificationKind = 'PAYMENT_APPROVED' | 'PAYMENT_REJECTED' | 'RENEWAL_DUE' | 'ACCESS_ENDED' | 'NOTICE';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Path inside the Edu web app. */
  linkPath: string | null;
  createdAt: string;
  readAt: string | null;
}

/** Learner account centre (FR-AUTH-104). Mirrors MeDto and SubscriptionDto in the Edu API. */
export interface Me {
  displayName: string | null;
  email: string | null;
  memberSince: string;
  /** Unread notifications across every workspace (the header bell). */
  unreadNotifications: number;
}

export interface Subscription {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  kind: OfferingKind;
  state: 'ACTIVE' | 'ENDED';
  source: 'FREE' | 'PURCHASE' | 'SUBSCRIPTION' | 'ADMIN_GRANT';
  planLabel: string | null;
  paidMinor: number | null;
  since: string;
  /** Null while active means lifetime. */
  endsAt: string | null;
}

/** Live classes (ADR-028 point 8). Mirrors backend/products/edu-api/src/live/live-sessions.dto.ts. */
export type Visibility = 'FREE' | 'SUBSCRIBERS';
export type LiveProvider = 'GOOGLE_MEET' | 'ZOOM' | 'MICROSOFT_TEAMS' | 'OTHER';

export interface LiveSession {
  id: string;
  title: string;
  startsAt: string;
  durationMin: number;
  visibility: Visibility;
  provider: LiveProvider;
  cancelled: boolean;
  /** Only for people allowed to join. */
  joinUrl: string | null;
  locked: boolean;
}

export interface LiveSessionInput {
  title?: string;
  startsAt?: string;
  durationMin?: number;
  joinUrl?: string;
  visibility?: Visibility;
  cancelled?: boolean;
}

/** Oxinov's public store (ADR-028). Mirrors backend/products/edu-api/src/store/storefront.dto.ts. */
export type OfferingKind = 'COURSE' | 'TRAINING' | 'IDEA' | 'THINK_TANK' | 'SKILL';
export type OfferingCategory = 'LANGUAGES' | 'TECHNOLOGY' | 'IDEAS_RESEARCH' | 'OTHER';

export interface StorePlan {
  period: PlanPeriod;
  label: string;
  priceMinor: number;
  currency: string;
}

export interface StoreOffering {
  id: string;
  slug: string;
  title: string;
  summary: string;
  kind: OfferingKind;
  category: OfferingCategory;
  language: string;
  fromMinor: number;
  currency: string;
  hasPlans: boolean;
  free: boolean;
  lessonCount: number;
  freeLessonCount: number;
  /** Average of approved reviews; null when there are none (FR-CATALOG-304). */
  ratingAverage: number | null;
  ratingCount: number;
}

export interface StoreHome {
  name: string;
  slug: string;
  defaultPlans: StorePlan[];
  offerings: StoreOffering[];
  /** The next live classes of published offerings: time and title only, never a join link. */
  upcomingLive: { title: string; startsAt: string; durationMin: number; visibility: Visibility; offeringSlug: string; offeringTitle: string }[];
}

export interface StoreOfferingDetail extends StoreOffering {
  description: string;
  outcomes: string[];
  curriculum: { title: string; lessons: { title: string; kind: string; isPreview: boolean; durationSec: number | null }[] }[];
  plans: StorePlan[];
  refundPolicy: string;
  reviewTimeText: string;
  storeSlug: string;
  /** Upcoming live classes: time and title only. */
  liveSessions: { title: string; startsAt: string; durationMin: number; visibility: Visibility }[];
  /** Bank QR checkout is set up, so plans can be bought now. */
  checkoutOpen: boolean;
  /** The instructor (the offering's author), by display name only (FR-CATALOG-315). */
  instructorName: string | null;
  rating: RatingSummary;
  /** Newest approved reviews; the author is a first name and last initial. */
  reviews: { author: string; rating: number; body: string; createdAt: string }[];
}

/** Support messages (FR-CHAT-1301) and OXI, the rule-based course advisor (FR-AI-1705). */
export interface SupportMessage {
  id: string;
  sender: 'LEARNER' | 'STAFF';
  body: string;
  createdAt: string;
  /** The learner's name on their own messages; null for support. */
  authorName: string | null;
}

export interface LearnerSupport {
  threadId: string | null;
  unread: boolean;
  messages: SupportMessage[];
}

export interface SupportThreadSummary {
  id: string;
  learnerName: string | null;
  learnerEmail: string | null;
  lastMessage: string;
  lastSender: 'LEARNER' | 'STAFF';
  lastMessageAt: string;
  unread: boolean;
}

export interface SupportThread {
  id: string;
  learnerName: string | null;
  learnerEmail: string | null;
  messages: SupportMessage[];
}

export interface OxiAnswer {
  reply: string;
  picks: { slug: string; title: string; kind: OfferingKind; category: OfferingCategory; why: string }[];
  handoff: boolean;
}

/** Notices by email within the daily allowance (FR-COMM-705). */
export interface EmailAllowance {
  limit: number;
  used: number;
  remaining: number;
  /** Notices can be emailed here (the store workspace only). */
  emailAvailable: boolean;
}

export interface NoticeSent {
  recipients: number;
  emailedNow: number;
  emailWaiting: number;
}

/** Account deletion with a 14-day wait (FR-PRIV-3202). */
export interface DeletionStatus {
  state: 'NONE' | 'SCHEDULED' | 'CANCELLED';
  requestedAt: string | null;
  deleteAfter: string | null;
}

/** Ratings and reviews (FR-CATALOG-304, approve first). */
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'HIDDEN';

export interface RatingSummary {
  average: number | null;
  count: number;
  /** Approved reviews with 5, 4, 3, 2, and 1 stars. */
  stars: number[];
}

export interface MyReview {
  canReview: boolean;
  rating: number | null;
  body: string;
  status: ReviewStatus | null;
  updatedAt: string | null;
}

export interface ModerationReview {
  id: string;
  courseId: string;
  courseTitle: string;
  learnerName: string | null;
  learnerEmail: string | null;
  rating: number;
  body: string;
  status: ReviewStatus;
  moderationReason: string | null;
  updatedAt: string;
}

async function request<T>(token: string, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${eduApiBaseUrl()}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });
  // 204 No Content: the action succeeded and there is nothing to return.
  if (response.status === 204) return undefined as T;
  const json = (await response.json().catch(() => ({}))) as { data?: T; error?: { code: string; message: string } };
  if (!response.ok || json.data === undefined) {
    throw new EduApiError(response.status, json.error?.code ?? 'UNAVAILABLE', json.error?.message ?? 'Oxinov Edu is unavailable. Try again shortly.');
  }
  return json.data;
}

/** Public endpoints (certificate verification) take no token. */
async function publicRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${eduApiBaseUrl()}${path}`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  const json = (await response.json().catch(() => ({}))) as { data?: T; error?: { code: string; message: string } };
  if (!response.ok || json.data === undefined) {
    throw new EduApiError(response.status, json.error?.code ?? 'UNAVAILABLE', json.error?.message ?? 'Oxinov Edu is unavailable. Try again shortly.');
  }
  return json.data;
}

const tenantPath = (tenantId: string) => `/v1/tenants/${encodeURIComponent(tenantId)}`;

export const eduApi = {
  workspaces: (token: string) => request<Workspace[]>(token, '/v1/tenants'),
  createWorkspace: (token: string, body: { slug: string; name: string }) =>
    request<Workspace>(token, '/v1/tenants', { method: 'POST', body }),
  courses: (token: string, tenantId: string, q?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (limit) params.set('limit', String(limit));
    const query = params.toString();
    return request<CourseSummary[]>(token, `${tenantPath(tenantId)}/courses${query ? `?${query}` : ''}`);
  },
  course: (token: string, tenantId: string, courseId: string) =>
    request<CourseDetail>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}`),
  lesson: (token: string, tenantId: string, courseId: string, lessonId: string) =>
    request<Lesson>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`),
  enroll: (token: string, tenantId: string, courseId: string) =>
    request<Enrollment>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/enrollments`, { method: 'POST' }),
  myEnrollments: (token: string, tenantId: string) => request<Enrollment[]>(token, `${tenantPath(tenantId)}/me/enrollments`),
  checkoutOptions: (token: string, tenantId: string, courseId: string) =>
    request<CheckoutOptions>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/checkout`),
  startCheckout: (token: string, tenantId: string, courseId: string, provider: PaymentProvider) =>
    request<Checkout>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/checkout`, { method: 'POST', body: { provider } }),
  progress: (token: string, tenantId: string, courseId: string) =>
    request<CourseProgress>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/progress`),
  completeLesson: (token: string, tenantId: string, courseId: string, lessonId: string) =>
    request<CourseProgress>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/complete`, { method: 'POST' }),
  myCertificates: (token: string, tenantId: string) => request<Certificate[]>(token, `${tenantPath(tenantId)}/me/certificates`),
  certificate: (token: string, tenantId: string, code: string) =>
    request<Certificate>(token, `${tenantPath(tenantId)}/certificates/${encodeURIComponent(code)}`),
  courseCertificates: (token: string, tenantId: string, courseId: string) =>
    request<Certificate[]>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/certificates`),
  revokeCertificate: (token: string, tenantId: string, code: string, reason: string) =>
    request<Certificate>(token, `${tenantPath(tenantId)}/certificates/${encodeURIComponent(code)}/revoke`, { method: 'POST', body: { reason } }),
  verifyCertificate: (code: string) => publicRequest<CertificateVerification>(`/v1/certificates/${encodeURIComponent(code)}`),
  liveSessions: (token: string, tenantId: string, courseId: string) =>
    request<LiveSession[]>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/live-sessions`),
  createLiveSession: (token: string, tenantId: string, courseId: string, body: LiveSessionInput) =>
    request<LiveSession>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/live-sessions`, { method: 'POST', body }),
  updateLiveSession: (token: string, tenantId: string, sessionId: string, body: LiveSessionInput) =>
    request<LiveSession>(token, `${tenantPath(tenantId)}/live-sessions/${encodeURIComponent(sessionId)}`, { method: 'PATCH', body }),
  me: (token: string) => request<Me>(token, '/v1/me'),
  myNotifications: (token: string, tenantId: string) => request<{ items: AppNotification[]; unread: number }>(token, `${tenantPath(tenantId)}/me/notifications`),
  readNotification: (token: string, tenantId: string, notificationId: string) =>
    request<void>(token, `${tenantPath(tenantId)}/me/notifications/${encodeURIComponent(notificationId)}/read`, { method: 'POST' }),
  readAllNotifications: (token: string, tenantId: string) => request<void>(token, `${tenantPath(tenantId)}/me/notifications/read-all`, { method: 'POST' }),
  sendNotice: (token: string, tenantId: string, body: { title: string; body: string; linkPath?: string; courseId?: string; email?: boolean }) =>
    request<NoticeSent>(token, `${tenantPath(tenantId)}/notices`, { method: 'POST', body }),
  emailAllowance: (token: string, tenantId: string) => request<EmailAllowance>(token, `${tenantPath(tenantId)}/notices/email-allowance`),
  mySubscriptions: (token: string, tenantId: string) => request<Subscription[]>(token, `${tenantPath(tenantId)}/me/subscriptions`),
  myBankPayments: (token: string, tenantId: string) => request<BankPayment[]>(token, `${tenantPath(tenantId)}/me/bank-payments`),
  storeHome: () => publicRequest<StoreHome>('/v1/store'),
  storeOffering: (slug: string) => publicRequest<StoreOfferingDetail>(`/v1/store/offerings/${encodeURIComponent(slug)}`),
  joinStore: (token: string) => request<Workspace>(token, '/v1/store/join', { method: 'POST' }),
  setListing: (token: string, tenantId: string, courseId: string, body: { kind: OfferingKind; category: OfferingCategory }) =>
    request<{ courseId: string; kind: OfferingKind; category: OfferingCategory }>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/listing`, { method: 'PUT', body }),
  verifyPayment: (token: string, tenantId: string, paymentId: string) =>
    request<Payment>(token, `${tenantPath(tenantId)}/payments/${encodeURIComponent(paymentId)}/verify`, { method: 'POST' }),
  exams: (token: string, tenantId: string, courseId: string) =>
    request<ExamSummary[]>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/exams`),
  startAttempt: (token: string, tenantId: string, examId: string) =>
    request<Attempt>(token, `${tenantPath(tenantId)}/exams/${encodeURIComponent(examId)}/attempts`, { method: 'POST' }),
  attempt: (token: string, tenantId: string, attemptId: string) =>
    request<Attempt>(token, `${tenantPath(tenantId)}/exam-attempts/${encodeURIComponent(attemptId)}`),
  saveAnswers: (token: string, tenantId: string, attemptId: string, answers: { itemId: string; response: AnswerResponse }[]) =>
    request<Attempt>(token, `${tenantPath(tenantId)}/exam-attempts/${encodeURIComponent(attemptId)}/answers`, {
      method: 'PUT',
      body: { answers },
    }),
  invites: (token: string, tenantId: string) => request<Invite[]>(token, `${tenantPath(tenantId)}/invites`),
  createInvite: (token: string, tenantId: string, body: { role: TenantRole; expiresInDays?: number; maxUses?: number }) =>
    request<Invite>(token, `${tenantPath(tenantId)}/invites`, { method: 'POST', body }),
  revokeInvite: (token: string, tenantId: string, inviteId: string) =>
    request<Invite>(token, `${tenantPath(tenantId)}/invites/${encodeURIComponent(inviteId)}`, { method: 'DELETE' }),
  members: (token: string, tenantId: string) => request<Member[]>(token, `${tenantPath(tenantId)}/members`),
  updateMember: (token: string, tenantId: string, userId: string, body: { role?: TenantRole; status?: 'ACTIVE' | 'SUSPENDED' }) =>
    request<Member>(token, `${tenantPath(tenantId)}/members/${encodeURIComponent(userId)}`, { method: 'PATCH', body }),
  auditEvents: (token: string, tenantId: string) => request<AuditEvent[]>(token, `${tenantPath(tenantId)}/audit-events`),
  mySupport: (token: string, tenantId: string) => request<LearnerSupport>(token, `${tenantPath(tenantId)}/me/support`),
  supportUnread: (token: string, tenantId: string) => request<boolean>(token, `${tenantPath(tenantId)}/me/support/unread`),
  sendSupport: (token: string, tenantId: string, body: string) => request<LearnerSupport>(token, `${tenantPath(tenantId)}/me/support`, { method: 'POST', body: { body } }),
  supportInbox: (token: string, tenantId: string) => request<SupportThreadSummary[]>(token, `${tenantPath(tenantId)}/support/threads`),
  supportThread: (token: string, tenantId: string, threadId: string) => request<SupportThread>(token, `${tenantPath(tenantId)}/support/threads/${encodeURIComponent(threadId)}`),
  replySupport: (token: string, tenantId: string, threadId: string, body: string) =>
    request<SupportThread>(token, `${tenantPath(tenantId)}/support/threads/${encodeURIComponent(threadId)}/messages`, { method: 'POST', body: { body } }),
  askOxi: (token: string, question: string) => request<OxiAnswer>(token, '/v1/oxi/ask', { method: 'POST', body: { question } }),
  deletionStatus: (token: string) => request<DeletionStatus>(token, '/v1/me/deletion'),
  requestDeletion: (token: string, confirm: string) => request<DeletionStatus>(token, '/v1/me/deletion', { method: 'POST', body: { confirm } }),
  cancelDeletion: (token: string) => request<DeletionStatus>(token, '/v1/me/deletion', { method: 'DELETE' }),
  /** A copy of the caller's Edu data (FR-PRIV-3201), as stored; the web app offers it as a file. */
  exportData: (token: string) => request<unknown>(token, '/v1/me/export'),
  myReview: (token: string, tenantId: string, courseId: string) => request<MyReview>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/review`),
  saveReview: (token: string, tenantId: string, courseId: string, body: { rating: number; body: string }) =>
    request<MyReview>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/review`, { method: 'PUT', body }),
  withdrawReview: (token: string, tenantId: string, courseId: string) =>
    request<void>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/review`, { method: 'DELETE' }),
  moderationReviews: (token: string, tenantId: string, status: ReviewStatus) =>
    request<ModerationReview[]>(token, `${tenantPath(tenantId)}/store/reviews?status=${status}`),
  approveReview: (token: string, tenantId: string, reviewId: string) =>
    request<void>(token, `${tenantPath(tenantId)}/store/reviews/${encodeURIComponent(reviewId)}/approve`, { method: 'POST' }),
  hideReview: (token: string, tenantId: string, reviewId: string, reason: string) =>
    request<void>(token, `${tenantPath(tenantId)}/store/reviews/${encodeURIComponent(reviewId)}/hide`, { method: 'POST', body: { reason } }),
  mediaLibrary: (token: string, tenantId: string) => request<LibraryItem[]>(token, `${tenantPath(tenantId)}/media/library`),
  grants: (token: string, tenantId: string) => request<Grant[]>(token, `${tenantPath(tenantId)}/store/grants`),
  grantAccess: (token: string, tenantId: string, body: { email: string; courseId: string; length: GrantLength; reason: string }) =>
    request<Grant>(token, `${tenantPath(tenantId)}/store/grants`, { method: 'POST', body }),
  revokeGrant: (token: string, tenantId: string, grantId: string, reason: string) =>
    request<Grant>(token, `${tenantPath(tenantId)}/store/grants/${encodeURIComponent(grantId)}/revoke`, { method: 'POST', body: { reason } }),
  redeemInvite: (token: string, code: string) => request<Workspace>(token, '/v1/invites/redeem', { method: 'POST', body: { code } }),
  authoredCourses: (token: string, tenantId: string) => request<AuthoredCourse[]>(token, `${tenantPath(tenantId)}/authoring/courses`),
  createCourse: (
    token: string,
    tenantId: string,
    body: { slug: string; title: string; summary: string; language: string; priceMinor: number; currency: string },
  ) => request<CourseSummary>(token, `${tenantPath(tenantId)}/courses`, { method: 'POST', body }),
  draft: (token: string, tenantId: string, courseId: string) =>
    request<Draft>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/draft`),
  /** Draft editing call: `path` is relative to the course's draft, for example `/sections`. */
  pasteLessons: (token: string, tenantId: string, courseId: string, sectionId: string, body: { text: string; driveKind: 'DOCUMENT' | 'VIDEO' }) =>
    request<{ draft: Draft; created: number; refused: { line: number; text: string; reason: string }[] }>(
      token,
      `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/draft/sections/${encodeURIComponent(sectionId)}/lessons/bulk`,
      { method: 'POST', body },
    ),
  duplicateCourse: (token: string, tenantId: string, courseId: string, body: { title?: string }) =>
    request<{ courseId: string; slug: string; title: string }>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/duplicate`, { method: 'POST', body }),
  draftCall: (token: string, tenantId: string, courseId: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', path: string, body?: unknown) =>
    request<Draft>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/draft${path}`, { method, body }),
  createUpload: (token: string, tenantId: string, body: { kind: 'VIDEO' | 'AUDIO'; contentType: string; sizeBytes: number; fileName: string }) =>
    request<UploadTicket>(token, `${tenantPath(tenantId)}/media/uploads`, { method: 'POST', body }),
  completeUpload: (token: string, tenantId: string, mediaId: string, durationSec: number) =>
    request<MediaFile>(token, `${tenantPath(tenantId)}/media/${encodeURIComponent(mediaId)}/complete`, { method: 'POST', body: { durationSec } }),
  saveProgress: (token: string, tenantId: string, mediaId: string, body: { positionSec: number; playedSec: number }) =>
    request<{ positionSec: number; watchedSec: number; completed: boolean }>(token, `${tenantPath(tenantId)}/media/${encodeURIComponent(mediaId)}/progress`, {
      method: 'PUT',
      body,
    }),
  quizzes: (token: string, tenantId: string, courseId: string) => request<Quiz[]>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/quizzes`),
  createQuiz: (token: string, tenantId: string, courseId: string, body: unknown) =>
    request<Quiz>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/quizzes`, { method: 'POST', body }),
  quiz: (token: string, tenantId: string, quizId: string) => request<Quiz>(token, `${tenantPath(tenantId)}/quizzes/${encodeURIComponent(quizId)}`),
  /** Quiz builder call: `path` is relative to the quiz, for example `/sections`. */
  quizCall: (token: string, tenantId: string, quizId: string, method: 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown) =>
    request<Quiz>(token, `${tenantPath(tenantId)}/quizzes/${encodeURIComponent(quizId)}${path}`, { method, body }),
  courseAssignments: (token: string, tenantId: string, courseId: string) =>
    request<Assignment[]>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/assignments`),
  manageAssignments: (token: string, tenantId: string, courseId: string) =>
    request<Assignment[]>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/assignments/manage`),
  createAssignment: (token: string, tenantId: string, courseId: string, body: unknown) =>
    request<Assignment>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/assignments`, { method: 'POST', body }),
  /** Teacher call on an assignment: '' (PATCH settings), '/publish', '/close'. */
  assignmentCall: (token: string, tenantId: string, assignmentId: string, method: 'POST' | 'PATCH', path: string, body?: unknown) =>
    request<Assignment>(token, `${tenantPath(tenantId)}/assignments/${encodeURIComponent(assignmentId)}${path}`, { method, body }),
  assignmentSubmissions: (token: string, tenantId: string, assignmentId: string) =>
    request<SubmissionSummary[]>(token, `${tenantPath(tenantId)}/assignments/${encodeURIComponent(assignmentId)}/submissions`),
  submission: (token: string, tenantId: string, submissionId: string) =>
    request<SubmissionDetail>(token, `${tenantPath(tenantId)}/submissions/${encodeURIComponent(submissionId)}`),
  gradeSubmission: (token: string, tenantId: string, submissionId: string, body: unknown) =>
    request<SubmissionDetail>(token, `${tenantPath(tenantId)}/submissions/${encodeURIComponent(submissionId)}/grade`, { method: 'POST', body }),
  mySubmission: (token: string, tenantId: string, assignmentId: string) =>
    request<MySubmission>(token, `${tenantPath(tenantId)}/assignments/${encodeURIComponent(assignmentId)}/mine`),
  /** Learner call on their own work: '/draft' (PUT), '/upload', '/upload/complete', '/submit' (POST), '/file' (DELETE). */
  mineCall: <T = MySubmission>(token: string, tenantId: string, assignmentId: string, method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown) =>
    request<T>(token, `${tenantPath(tenantId)}/assignments/${encodeURIComponent(assignmentId)}/mine${path}`, { method, body }),
  lessonNotes: (token: string, tenantId: string, courseId: string, lessonId: string) =>
    request<Note[]>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/notes`),
  courseNotes: (token: string, tenantId: string, courseId: string) => request<Note[]>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/notes`),
  addNote: (token: string, tenantId: string, courseId: string, lessonId: string, body: { body: string; timestampSec: number | null }) =>
    request<Note>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/notes`, { method: 'POST', body }),
  updateNote: (token: string, tenantId: string, noteId: string, body: { body?: string; timestampSec?: number | null }) =>
    request<Note>(token, `${tenantPath(tenantId)}/notes/${encodeURIComponent(noteId)}`, { method: 'PATCH', body }),
  deleteNote: async (token: string, tenantId: string, noteId: string): Promise<void> => {
    const response = await fetch(`${eduApiBaseUrl()}${tenantPath(tenantId)}/notes/${encodeURIComponent(noteId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!response.ok) throw new EduApiError(response.status, 'UNAVAILABLE', 'The note could not be deleted.');
  },
  announcements: (token: string, tenantId: string, courseId: string) =>
    request<Announcements>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/announcements`),
  courseQuestions: (token: string, tenantId: string, courseId: string) =>
    request<Questions>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/questions`),
  lessonQuestions: (token: string, tenantId: string, courseId: string, lessonId: string) =>
    request<Questions>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/questions`),
  /** Class stream writes (FR-COMM-701/702); `path` is relative to the tenant. 204 responses resolve to null. */
  streamCall: async (token: string, tenantId: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<unknown> => {
    if (method !== 'DELETE' || !path.startsWith('/announcements/')) return request<unknown>(token, `${tenantPath(tenantId)}${path}`, { method, body });
    const response = await fetch(`${eduApiBaseUrl()}${tenantPath(tenantId)}${path}`, {
      method,
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!response.ok) throw new EduApiError(response.status, 'UNAVAILABLE', 'The announcement could not be deleted.');
    return null;
  },
  startResourceUpload: (token: string, tenantId: string, courseId: string, body: { fileName: string; contentType: string; sizeBytes: number }) =>
    request<{ fileId: string; uploadUrl: string; headers: Record<string, string> }>(
      token,
      `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/draft/resources/uploads`,
      { method: 'POST', body },
    ),
  completeResourceUpload: (token: string, tenantId: string, courseId: string, fileId: string) =>
    request<{ fileId: string; fileName: string }>(
      token,
      `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/draft/resources/uploads/${encodeURIComponent(fileId)}/complete`,
      { method: 'POST' },
    ),
  // Oxinov store (ADR-028): plans, bank QR payments, review, settings, coupons.
  checkoutInfo: (token: string, tenantId: string, courseId: string) =>
    request<CheckoutInfo>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/plans`),
  startBankQr: (token: string, tenantId: string, courseId: string, body: { period: PlanPeriod; couponCode?: string }) =>
    request<BankCheckout>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/checkout/bank-qr`, { method: 'POST', body }),
  bankPayment: (token: string, tenantId: string, paymentId: string) =>
    request<BankCheckout>(token, `${tenantPath(tenantId)}/me/bank-payments/${encodeURIComponent(paymentId)}`),
  evidenceUpload: (token: string, tenantId: string, paymentId: string, body: { contentType: string; sizeBytes: number }) =>
    request<StoreUploadTicket>(token, `${tenantPath(tenantId)}/me/bank-payments/${encodeURIComponent(paymentId)}/evidence-upload`, { method: 'POST', body }),
  submitBankPayment: (token: string, tenantId: string, paymentId: string, body: { bankTransactionId: string; paidAmount: number; referenceIncluded: boolean }) =>
    request<BankPayment>(token, `${tenantPath(tenantId)}/me/bank-payments/${encodeURIComponent(paymentId)}/submit`, { method: 'POST', body }),
  reviewQueue: (token: string, tenantId: string, status: 'PENDING_REVIEW' | 'SUCCEEDED' | 'REJECTED') =>
    request<ReviewItem[]>(token, `${tenantPath(tenantId)}/store/payments?status=${status}`),
  reviewDetail: (token: string, tenantId: string, paymentId: string) =>
    request<ReviewItem>(token, `${tenantPath(tenantId)}/store/payments/${encodeURIComponent(paymentId)}`),
  approvePayment: (token: string, tenantId: string, paymentId: string) =>
    request<ReviewItem>(token, `${tenantPath(tenantId)}/store/payments/${encodeURIComponent(paymentId)}/approve`, { method: 'POST' }),
  rejectPayment: (token: string, tenantId: string, paymentId: string, reason: string) =>
    request<ReviewItem>(token, `${tenantPath(tenantId)}/store/payments/${encodeURIComponent(paymentId)}/reject`, { method: 'POST', body: { reason } }),
  managePlans: (token: string, tenantId: string, courseId: string) =>
    request<{ plans: Plan[]; defaults: Record<PlanPeriod, number> }>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/plans/manage`),
  setPlans: (token: string, tenantId: string, courseId: string, plans: { period: PlanPeriod; priceMinor: number; active: boolean }[]) =>
    request<Plan[]>(token, `${tenantPath(tenantId)}/courses/${encodeURIComponent(courseId)}/plans`, { method: 'PUT', body: { plans } }),
  storeSettings: (token: string, tenantId: string) => request<StoreSettings>(token, `${tenantPath(tenantId)}/store/settings`),
  updateStoreSettings: (token: string, tenantId: string, body: Record<string, unknown>) =>
    request<StoreSettings>(token, `${tenantPath(tenantId)}/store/settings`, { method: 'PATCH', body }),
  qrUpload: (token: string, tenantId: string, body: { contentType: string; sizeBytes: number }) =>
    request<StoreUploadTicket>(token, `${tenantPath(tenantId)}/store/settings/qr-upload`, { method: 'POST', body }),
  qrComplete: (token: string, tenantId: string, body: { uploadId: string; contentType: string }) =>
    request<StoreSettings>(token, `${tenantPath(tenantId)}/store/settings/qr-complete`, { method: 'POST', body }),
  coupons: (token: string, tenantId: string) => request<Coupon[]>(token, `${tenantPath(tenantId)}/store/coupons`),
  createCoupon: (token: string, tenantId: string, body: Record<string, unknown>) =>
    request<Coupon>(token, `${tenantPath(tenantId)}/store/coupons`, { method: 'POST', body }),
  setCouponActive: (token: string, tenantId: string, couponId: string, active: boolean) =>
    request<Coupon>(token, `${tenantPath(tenantId)}/store/coupons/${encodeURIComponent(couponId)}`, { method: 'PATCH', body: { active } }),
  submitAttempt: (token: string, tenantId: string, attemptId: string) =>
    request<Attempt>(token, `${tenantPath(tenantId)}/exam-attempts/${encodeURIComponent(attemptId)}/submit`, { method: 'POST' }),
};
