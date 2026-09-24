# Oxinov Jobs charter

**Status:** Draft. **Address:** `jobs.oxinov.com`. **Pillar:** Oxinov Education (talent and placements). **Origin:** Flo Softwares `hr-backend` / `human-resource` (duplicate) and `hr-frontend`.

## Problem and customers

Employers in Nepal struggle to find verified, skilled candidates, and learners who complete training have no direct route to relevant jobs. Oxinov Jobs connects verified candidates, including Oxinov Edu graduates, with verified employers using skill and location matching.

| Role | Description |
| --- | --- |
| Candidate | Maintains a profile, skills, employment history, and applies to jobs |
| Employer | Verified organization that posts jobs and manages applications |
| Recruiter | Employer staff member with delegated hiring permissions |
| Oxinov operations | Verifies employers, moderates postings, handles reports |

## First release scope

- Candidate profiles linked to Oxinov identity, with skills and employment history.
- Employer accounts as platform organizations with organization KYC.
- Job postings with type, location, skills, salary range, and moderation.
- Applications with a documented status lifecycle and employer-candidate messaging.
- Skill and location matching with an explainable ranking.
- Display of verified Oxinov Edu certificates on candidate profiles through the LMS API.

## Out of scope for the first release

- Training courses, exams, exam bookings, and certifications (owned by Oxinov Edu).
- Platform coins, wallets, or paid credits (requires payments and regulatory review).
- Recruitment or placement for employment abroad, including Japan SSW placements (requires a foreign employment licence).
- Automated hiring decisions; AI may rank or summarize but a person decides.
- Its own login, OTP, KYC, notifications, or payment code.

## Reuse from the source concept

Reuse as reference: `JobPosting`, `JobApplication`, `UrgentJob`, `EmploymentHistory`, `TrendingJob`, `TrendingSkill`, and the skill-matching rules; employer and candidate dashboard screens. Move to Oxinov Edu: `TrainingCourse`, `TrainingEnrollment`, `TrainingComment`, `TrainingRequest`, `Exam`, `ExamBooking`, `Certification`, and `Orientation`. Replace with platform services: `User`, `OTP`, `RefreshToken`, `IndividualKYC`, `IndustrialKYC`, `Notification`, `PlatformCoin`, and `CoinTransaction`. `Event` and `EventRegistration` stay out until a separate need is approved.

## Product plane

| Part | Location |
| --- | --- |
| Web frontend | `frontend/products/jobs-web/` at `jobs.oxinov.com` |
| API | `backend/products/jobs-api/` |
| Database | `database/products/jobs/` (own PostgreSQL database) |
| Contracts | `packages/contracts/jobs/` |

## Access and trust

| Action | Required level | Policy accepted |
| --- | --- | --- |
| Browse jobs | T0 Visitor | None |
| Create a candidate profile, save jobs | T1 Member | Oxinov Terms and Privacy |
| Apply to jobs, message employers | T2 Contact-verified | None |
| Post jobs and review applicants for an organization | T4 Business-verified | Employer Policy |

## Data classification

Confidential: candidate contact details, CVs, employment history, application status, employer KYC. Public: approved job postings and employer display profiles. Candidates control profile visibility.

## Regulatory review required before launch

- Nepal Labour Act and anti-discrimination requirements for job postings.
- Foreign Employment Act licensing if any overseas placement is offered.
- Individual privacy obligations for candidate data and retention of rejected applications.

These must be confirmed by qualified Nepal counsel; this charter does not state legal conclusions.

## Success metrics (targets to be set by the product owner)

Verified employers, active postings, applications per posting, time to first application, interview and hire rates reported by employers, and LMS-certified candidate placements.

## Release gate

| Item | Status |
| --- | --- |
| Accountable product owner | Pending |
| Rights to Flo Softwares concepts confirmed in writing | Pending |
| Launch employers and candidate segment | Pending |
| Pricing model (employer plans or per-posting) | Pending |
| Regulatory review | Pending |
| Moderation and support plan | Pending |
| Delivery budget and stop/continue checkpoint | Pending |
