/**
 * Server-side client for the Oxinov Edu API (backend/products/edu-api). The browser never calls it directly and never
 * sees tokens; every call carries the signed-in person's Edu access token. Types mirror the API DTOs.
 */
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

export interface Lesson extends LessonOutline {
  bodyMarkdown: string;
  media: LessonMedia | null;
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
  courses: (token: string, tenantId: string, q?: string) =>
    request<CourseSummary[]>(token, `${tenantPath(tenantId)}/courses${q ? `?q=${encodeURIComponent(q)}` : ''}`),
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
  submitAttempt: (token: string, tenantId: string, attemptId: string) =>
    request<Attempt>(token, `${tenantPath(tenantId)}/exam-attempts/${encodeURIComponent(attemptId)}/submit`, { method: 'POST' }),
};
