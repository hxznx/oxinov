import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { PublicReviewDto, RatingSummaryDto } from '../reviews/reviews.dto';
import { OFFERING_CATEGORIES, OFFERING_KINDS, PLAN_PERIODS, type OfferingCategory, type OfferingKind, type PlanPeriod } from './store-rules';

/** One offering on the public store (ADR-028): what a visitor may see before signing in. */
export class StoreOfferingDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() slug: string;
  @ApiProperty() title: string;
  @ApiProperty() summary: string;
  @ApiProperty({ enum: OFFERING_KINDS }) kind: OfferingKind;
  @ApiProperty({ enum: OFFERING_CATEGORIES }) category: OfferingCategory;
  @ApiProperty({ description: 'Language the offering is taught in (BCP 47).' }) language: string;
  @ApiProperty({ description: 'Cheapest active plan, or the single price, in minor units.' }) fromMinor: number;
  @ApiProperty({ example: 'NPR' }) currency: string;
  @ApiProperty() hasPlans: boolean;
  @ApiProperty({ description: 'No plans and no price: anyone signed in can learn it.' }) free: boolean;
  @ApiProperty() lessonCount: number;
  @ApiProperty({ description: 'Lessons open to everyone as a free preview.' }) freeLessonCount: number;
  @ApiProperty({ nullable: true, type: Number, description: 'Average of approved reviews (FR-CATALOG-304).' }) ratingAverage: number | null;
  @ApiProperty() ratingCount: number;
}

export class StorePlanDto {
  @ApiProperty({ enum: PLAN_PERIODS }) period: PlanPeriod;
  @ApiProperty({ example: '1 year' }) label: string;
  @ApiProperty() priceMinor: number;
  @ApiProperty({ example: 'NPR' }) currency: string;
}

export class StoreHomeDto {
  @ApiProperty() name: string;
  @ApiProperty({ description: 'Workspace address of the store; learners study at /w/{slug}.' }) slug: string;
  @ApiProperty({ type: [StorePlanDto], description: 'Default plan prices, for the hero price list.' }) defaultPlans: StorePlanDto[];
  @ApiProperty({ type: [StoreOfferingDto] }) offerings: StoreOfferingDto[];
  @ApiProperty({ type: () => [StoreUpcomingLiveDto], description: 'The next live classes of published offerings, soonest first; times only, never join links.' })
  upcomingLive: StoreUpcomingLiveDto[];
}

/** A live class on the store home (design screen 1): when, what, and which offering. No meeting link. */
export class StoreUpcomingLiveDto {
  @ApiProperty() title: string;
  @ApiProperty({ format: 'date-time' }) startsAt: Date;
  @ApiProperty() durationMin: number;
  @ApiProperty({ enum: ['FREE', 'SUBSCRIBERS'] }) visibility: 'FREE' | 'SUBSCRIBERS';
  @ApiProperty() offeringSlug: string;
  @ApiProperty() offeringTitle: string;
}

export class StoreLessonDto {
  @ApiProperty() title: string;
  @ApiProperty() kind: string;
  @ApiProperty({ description: 'Open to everyone as a free preview.' }) isPreview: boolean;
  @ApiProperty({ nullable: true, type: Number }) durationSec: number | null;
}

export class StoreSectionDto {
  @ApiProperty() title: string;
  @ApiProperty({ type: [StoreLessonDto] }) lessons: StoreLessonDto[];
}

/** An upcoming live class on the public offering page: time and title, never the join link. */
export class StoreLiveSessionDto {
  @ApiProperty() title: string;
  @ApiProperty({ format: 'date-time' }) startsAt: Date;
  @ApiProperty() durationMin: number;
  @ApiProperty({ enum: ['FREE', 'SUBSCRIBERS'] }) visibility: 'FREE' | 'SUBSCRIBERS';
}

/** Offering page: introduction and syllabus are always public (ADR-028 point 7); lesson content is not. */
export class StoreOfferingDetailDto extends StoreOfferingDto {
  @ApiProperty() description: string;
  @ApiProperty({ type: [String] }) outcomes: string[];
  @ApiProperty({ type: [StoreSectionDto] }) curriculum: StoreSectionDto[];
  @ApiProperty({ type: [StorePlanDto] }) plans: StorePlanDto[];
  @ApiProperty() refundPolicy: string;
  @ApiProperty() reviewTimeText: string;
  @ApiProperty() storeSlug: string;
  @ApiProperty({ type: [StoreLiveSessionDto], description: 'Upcoming live classes, soonest first; no join links.' }) liveSessions: StoreLiveSessionDto[];
  @ApiProperty({ description: 'Bank QR checkout is set up (QR and account name), so plans can be bought now.' }) checkoutOpen: boolean;
  @ApiProperty({ nullable: true, type: String, description: 'Display name of the offering’s instructor (its author); never an email (FR-CATALOG-315).' })
  instructorName: string | null;
  @ApiProperty({ type: RatingSummaryDto }) rating: RatingSummaryDto;
  @ApiProperty({ type: [PublicReviewDto], description: 'Newest approved reviews; author is a first name and last initial.' }) reviews: PublicReviewDto[];
}

export class SetListingDto {
  @ApiProperty({ enum: OFFERING_KINDS }) @IsIn(OFFERING_KINDS) kind: OfferingKind;
  @ApiProperty({ enum: OFFERING_CATEGORIES }) @IsIn(OFFERING_CATEGORIES) category: OfferingCategory;
}

export class ListingDto {
  @ApiProperty({ format: 'uuid' }) courseId: string;
  @ApiProperty({ enum: OFFERING_KINDS }) kind: OfferingKind;
  @ApiProperty({ enum: OFFERING_CATEGORIES }) category: OfferingCategory;
}
