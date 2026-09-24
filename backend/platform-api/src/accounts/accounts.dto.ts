import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  Equals,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PolicyAcceptanceDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9-]{1,39}$/)
  policyId!: string;

  @IsInt()
  @Min(1)
  version!: number;
}

const CHANNELS = ['WEB', 'ANDROID', 'IOS'] as const;

class AcceptanceContextDto {
  @ValidateNested({ each: true })
  @Type(() => PolicyAcceptanceDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  accepted!: PolicyAcceptanceDto[];

  @IsIn(CHANNELS)
  channel!: (typeof CHANNELS)[number];

  /** BCP 47 tag, for example "en" or "ne-NP". */
  @Matches(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/)
  @MaxLength(16)
  locale!: string;
}

/** FR-ID-2205: one welcome screen, then "Agree and continue". */
export class WelcomeDto extends AcceptanceContextDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName?: string;

  /** ISO 3166-1 alpha-2, upper case. */
  @Matches(/^[A-Z]{2}$/)
  country!: string;

  /** The person confirms they meet the minimum age for their country. */
  @Equals(true)
  ageConfirmed!: boolean;
}

/** FR-POLICY-2404: re-acceptance after a material policy change. */
export class AcceptPoliciesDto extends AcceptanceContextDto {}
