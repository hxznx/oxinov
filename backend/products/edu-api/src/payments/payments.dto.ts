import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const PROVIDERS = ['KHALTI', 'ESEWA'] as const;

export class StartCheckoutDto {
  @ApiProperty({ enum: PROVIDERS }) @IsIn(PROVIDERS) provider: (typeof PROVIDERS)[number];
}

export class CheckoutOptionsDto {
  @ApiProperty({ description: 'Whether this course can be bought now.' }) available: boolean;
  @ApiProperty({ enum: PROVIDERS, isArray: true }) providers: string[];
  @ApiProperty({ description: 'Price in minor units (paisa for NPR).' }) amountMinor: number;
  @ApiProperty({ example: 'NPR' }) currency: string;
  @ApiProperty({ description: 'The caller already has access.' }) owned: boolean;
  @ApiProperty({ required: false, description: 'Why buying is unavailable, when it is.' }) reason?: string;
  @ApiProperty({ description: 'Payment mode: sandbox payments use the providers’ test systems.', enum: ['sandbox', 'live'] })
  mode: string;
}

export class RedirectDto {
  @ApiProperty({ enum: ['GET', 'POST'] }) method: 'GET' | 'POST';
  @ApiProperty() url: string;
  @ApiProperty({ required: false, description: 'Form fields to post (eSewa).' }) fields?: Record<string, string>;
}

export class CheckoutDto {
  @ApiProperty({ format: 'uuid' }) paymentId: string;
  @ApiProperty({ enum: PROVIDERS }) provider: string;
  @ApiProperty({ type: RedirectDto }) redirect: RedirectDto;
}

export class PaymentDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) courseId: string;
  @ApiProperty({ enum: PROVIDERS }) provider: string;
  @ApiProperty() amountMinor: number;
  @ApiProperty() currency: string;
  @ApiProperty({ enum: ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'] }) status: string;
  @ApiProperty({ required: false, nullable: true }) transactionId: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ required: false, nullable: true }) verifiedAt: Date | null;
}
