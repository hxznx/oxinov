import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EVIDENCE_MAX_BYTES, EVIDENCE_TYPES, GRANT_LENGTHS, PLAN_PERIODS, QR_MAX_BYTES, QR_TYPES, type GrantLength, type PlanPeriod } from './store-rules';

/** Largest price accepted for one plan: NPR 10,000,000 in paisa. */
const MAX_PRICE_MINOR = 1_000_000_000;

export class PlanDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: PLAN_PERIODS }) period: PlanPeriod;
  @ApiProperty({ example: '1 year' }) label: string;
  @ApiProperty({ description: 'Price in minor units (paisa for NPR).' }) priceMinor: number;
  @ApiProperty({ example: 'NPR' }) currency: string;
  @ApiProperty() active: boolean;
}

export class PlanInputDto {
  @ApiProperty({ enum: PLAN_PERIODS }) @IsIn(PLAN_PERIODS) period: PlanPeriod;
  @ApiProperty({ description: 'Price in paisa; at least NPR 10.' }) @IsInt() @Min(1000) @Max(MAX_PRICE_MINOR) priceMinor: number;
  @ApiProperty() @IsBoolean() active: boolean;
}

export class SetPlansDto {
  @ApiProperty({ type: [PlanInputDto] })
  @ValidateNested({ each: true })
  @Type(() => PlanInputDto)
  @ArrayMaxSize(4)
  plans: PlanInputDto[];
}

export class BankDetailsDto {
  @ApiProperty({ description: 'Whether bank QR payment can be used now.' }) available: boolean;
  @ApiProperty({ required: false, description: 'Why it cannot, when it cannot.' }) reason?: string;
  @ApiProperty({ required: false, nullable: true, description: 'Short-lived link to the QR image.' }) qrUrl: string | null;
  @ApiProperty({ required: false, nullable: true }) accountName: string | null;
  @ApiProperty({ required: false, nullable: true }) accountNumber: string | null;
  @ApiProperty({ required: false, nullable: true }) bankName: string | null;
  @ApiProperty() reviewTimeText: string;
  @ApiProperty({ required: false, nullable: true }) helpContact: string | null;
  @ApiProperty() refundPolicy: string;
}

/** One offering in the learner's account centre (FR-AUTH-104). */
export class SubscriptionDto {
  @ApiProperty({ format: 'uuid' }) courseId: string;
  @ApiProperty() courseTitle: string;
  @ApiProperty() courseSlug: string;
  @ApiProperty({ example: 'COURSE' }) kind: string;
  @ApiProperty({ enum: ['ACTIVE', 'ENDED'] }) state: 'ACTIVE' | 'ENDED';
  @ApiProperty({ enum: ['FREE', 'PURCHASE', 'SUBSCRIPTION', 'ADMIN_GRANT'] }) source: string;
  @ApiProperty({ nullable: true, type: String, example: '1 year' }) planLabel: string | null;
  @ApiProperty({ nullable: true, type: Number, description: 'Amount paid for the latest plan, in minor units.' }) paidMinor: number | null;
  @ApiProperty({ format: 'date-time' }) since: Date;
  @ApiProperty({ nullable: true, type: String, format: 'date-time', description: 'Null while active means lifetime.' }) endsAt: Date | null;
}

export class BankPaymentDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) courseId: string;
  @ApiProperty() courseTitle: string;
  @ApiProperty({ enum: ['PENDING', 'PENDING_REVIEW', 'SUCCEEDED', 'REJECTED', 'FAILED'] }) status: string;
  @ApiProperty({ example: 'OXE-7F3K2Q', description: 'Write this in the bank remarks.' }) reference: string;
  @ApiProperty({ enum: PLAN_PERIODS }) planPeriod: PlanPeriod;
  @ApiProperty() planLabel: string;
  @ApiProperty() listPriceMinor: number;
  @ApiProperty() discountMinor: number;
  @ApiProperty({ description: 'Amount to pay, in paisa.' }) amountMinor: number;
  @ApiProperty() currency: string;
  @ApiProperty({ required: false, nullable: true }) couponCode: string | null;
  @ApiProperty({ required: false, nullable: true }) bankTransactionId: string | null;
  @ApiProperty() hasEvidence: boolean;
  @ApiProperty({ required: false, nullable: true }) submittedAt: Date | null;
  @ApiProperty({ required: false, nullable: true }) reviewedAt: Date | null;
  @ApiProperty({ required: false, nullable: true, description: 'Why it was rejected.' }) reviewReason: string | null;
  @ApiProperty() createdAt: Date;
}

export class CheckoutInfoDto {
  @ApiProperty({ type: [PlanDto], description: 'Plans on sale, shortest first.' }) plans: PlanDto[];
  @ApiProperty({ type: BankDetailsDto }) bank: BankDetailsDto;
  @ApiProperty() owned: boolean;
  @ApiProperty({ required: false, nullable: true, description: 'When current access ends; null for lifetime.' }) accessEndsAt: Date | null;
  @ApiProperty({ type: BankPaymentDto, required: false, nullable: true, description: 'The learner’s open bank payment for this course.' })
  openPayment: BankPaymentDto | null;
}

export class StartBankQrDto {
  @ApiProperty({ enum: PLAN_PERIODS }) @IsIn(PLAN_PERIODS) period: PlanPeriod;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(40) couponCode?: string;
}

export class BankCheckoutDto {
  @ApiProperty({ type: BankPaymentDto }) payment: BankPaymentDto;
  @ApiProperty({ type: BankDetailsDto }) bank: BankDetailsDto;
}

export class EvidenceUploadDto {
  @ApiProperty({ enum: EVIDENCE_TYPES }) @IsIn(EVIDENCE_TYPES) contentType: (typeof EVIDENCE_TYPES)[number];
  @ApiProperty({ maximum: EVIDENCE_MAX_BYTES }) @IsInt() @Min(1) @Max(EVIDENCE_MAX_BYTES) sizeBytes: number;
}

export class UploadTicketDto {
  @ApiProperty({ format: 'uuid' }) uploadId: string;
  @ApiProperty() uploadUrl: string;
  @ApiProperty() headers: Record<string, string>;
  @ApiProperty() expiresAt: Date;
}

export class SubmitEvidenceDto {
  @ApiProperty({ example: 'FT26100112345', description: 'Transaction ID from the bank receipt.' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(4, 80)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9 ./_-]*$/, { message: 'Use the letters and numbers from your bank receipt.' })
  bankTransactionId: string;
}

export class ReviewCheckDto {
  @ApiProperty() ok: boolean;
  @ApiProperty() text: string;
}

export class ReviewItemDto extends BankPaymentDto {
  @ApiProperty() learnerName: string | null;
  @ApiProperty() learnerEmail: string | null;
  @ApiProperty({ type: [ReviewCheckDto] }) checks: ReviewCheckDto[];
  @ApiProperty({ required: false, nullable: true, description: 'Short-lived link to the screenshot or PDF.' }) evidenceUrl: string | null;
}

export class RejectPaymentDto {
  @ApiProperty({ description: 'Shown to the learner.' }) @IsString() @Length(5, 500) reason: string;
}

export class SettingsDto extends BankDetailsDto {
  @ApiProperty() referencePrefix: string;
  @ApiProperty() defaultMonth1Minor: number;
  @ApiProperty() defaultMonth6Minor: number;
  @ApiProperty() defaultYear1Minor: number;
  @ApiProperty() defaultLifetimeMinor: number;
  @ApiProperty() isSeller: boolean;
}

export class UpdateSettingsDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @Length(2, 120) accountName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @Matches(/^[0-9A-Za-z -]{4,60}$/) accountNumber?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @Length(2, 120) bankName?: string;
  @ApiProperty({ required: false, example: 'OXE-' }) @IsOptional() @Matches(/^[A-Z]{2,6}-$/) referencePrefix?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @Length(3, 120) reviewTimeText?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(120) helpContact?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(4000) refundPolicy?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1000) @Max(MAX_PRICE_MINOR) defaultMonth1Minor?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1000) @Max(MAX_PRICE_MINOR) defaultMonth6Minor?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1000) @Max(MAX_PRICE_MINOR) defaultYear1Minor?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1000) @Max(MAX_PRICE_MINOR) defaultLifetimeMinor?: number;
}

export class QrUploadDto {
  @ApiProperty({ enum: QR_TYPES }) @IsIn(QR_TYPES) contentType: (typeof QR_TYPES)[number];
  @ApiProperty({ maximum: QR_MAX_BYTES }) @IsInt() @Min(1) @Max(QR_MAX_BYTES) sizeBytes: number;
}

export class CompleteQrDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() uploadId: string;
  @ApiProperty({ enum: QR_TYPES }) @IsIn(QR_TYPES) contentType: (typeof QR_TYPES)[number];
}

export class CouponDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() code: string;
  @ApiProperty({ nullable: true }) percentOff: number | null;
  @ApiProperty({ nullable: true }) amountOffMinor: number | null;
  @ApiProperty({ nullable: true }) courseId: string | null;
  @ApiProperty({ nullable: true, enum: PLAN_PERIODS }) period: PlanPeriod | null;
  @ApiProperty({ nullable: true }) startsAt: Date | null;
  @ApiProperty({ nullable: true }) endsAt: Date | null;
  @ApiProperty({ nullable: true }) maxUses: number | null;
  @ApiProperty() usedCount: number;
  @ApiProperty() active: boolean;
}

export class CreateCouponDto {
  @ApiProperty({ example: 'DASHAIN25' }) @IsString() @Matches(/^[A-Za-z0-9][A-Za-z0-9-]{2,39}$/) code: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1) @Max(100) percentOff?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(100) @Max(MAX_PRICE_MINOR) amountOffMinor?: number;
  @ApiProperty({ required: false, format: 'uuid' }) @IsOptional() @IsUUID() courseId?: string;
  @ApiProperty({ required: false, enum: PLAN_PERIODS }) @IsOptional() @IsIn(PLAN_PERIODS) period?: PlanPeriod;
  @ApiProperty({ required: false }) @IsOptional() @IsISO8601() startsAt?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsISO8601() endsAt?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1) @Max(1_000_000) maxUses?: number;
}

export class UpdateCouponDto {
  @ApiProperty() @IsBoolean() active: boolean;
}

/** Free access for one learner (FR-MGMT-1404): scholarships, prizes, partners. A reason is required. */
export class GrantAccessDto {
  @ApiProperty({ description: 'Email of a member of this workspace.' }) @IsString() @Length(3, 254) email: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() courseId: string;
  @ApiProperty({ enum: GRANT_LENGTHS }) @IsIn(GRANT_LENGTHS) length: GrantLength;
  @ApiProperty({ description: 'Kept in the audit log.' }) @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)) @IsString() @Length(3, 500) reason: string;
}

export class RevokeGrantDto {
  @ApiProperty() @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)) @IsString() @Length(3, 500) reason: string;
}

export class GrantDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ nullable: true, type: String }) learnerName: string | null;
  @ApiProperty({ nullable: true, type: String }) learnerEmail: string | null;
  @ApiProperty() courseTitle: string;
  @ApiProperty({ format: 'date-time' }) startsAt: Date;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) endsAt: Date | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) revokedAt: Date | null;
  @ApiProperty({ nullable: true, type: String }) revokeReason: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
}
