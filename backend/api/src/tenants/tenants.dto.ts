import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { TenantRole } from '../generated/prisma/enums';

export class CreateTenantDto {
  @ApiProperty({ example: 'sakura', description: 'Workspace address: lowercase letters, digits, hyphens.' })
  @IsString()
  @Matches(/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])$/, {
    message: 'slug must be 3-63 lowercase letters, digits, or hyphens, not starting or ending with a hyphen',
  })
  slug: string;

  @ApiProperty({ example: 'Sakura Japanese School' })
  @IsString()
  @Length(2, 120)
  name: string;

  @ApiPropertyOptional({ example: '#C2185B' })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'primaryColor must be a #RRGGBB hex colour' })
  primaryColor?: string;

  @ApiPropertyOptional({ example: 'Asia/Tokyo' })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  timeZone?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @Matches(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, { message: 'defaultLocale must be a BCP 47 tag' })
  defaultLocale?: string;
}

export class WorkspaceDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
  @ApiProperty() status: string;
  @ApiProperty({ nullable: true, type: String }) primaryColor: string | null;
  @ApiProperty() timeZone: string;
  @ApiProperty() defaultLocale: string;
  @ApiProperty({ enum: TenantRole, enumName: 'TenantRole' }) role: TenantRole;
}
