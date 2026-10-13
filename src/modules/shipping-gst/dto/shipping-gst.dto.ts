import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
  Matches,
} from 'class-validator';

export class UpdateShippingGstSettingsDto {
  @IsNumber()
  @Min(0, { message: 'Base shipping fee must be a non-negative number' })
  baseShippingFee: number;

  @IsNumber()
  @Min(0, { message: 'GST tax rate cannot be negative' })
  @Max(100, { message: 'GST tax rate cannot exceed 100%' })
  gstRate: number;

  @IsNumber()
  @Min(0, { message: 'Free shipping threshold must be a non-negative number' })
  freeShippingThreshold: number;

  @IsBoolean()
  isFreeShippingEnabled: boolean;
}

export class CreateShippingZoneDto {
  @IsString()
  @IsNotEmpty({ message: 'Zone name is required' })
  zoneName: string;

  @IsString()
  @IsNotEmpty({ message: 'Pincode or prefix is required' })
  @Matches(/^[0-9]{1,6}$/, {
    message: 'Pincode prefix must be 1 to 6 digits (e.g. 56 or 560001)',
  })
  pincodePrefix: string;

  @IsNumber()
  @Min(0, { message: 'Shipping charge must be a non-negative amount' })
  shippingCharge: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateShippingZoneDto {
  @IsString()
  @IsOptional()
  zoneName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{1,6}$/, {
    message: 'Pincode prefix must be 1 to 6 digits (e.g. 56 or 560001)',
  })
  pincodePrefix?: string;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Shipping charge must be a non-negative amount' })
  shippingCharge?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CalculateShippingAndTaxDto {
  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  deliveryMethod?: 'COURIER' | 'STORE_PICKUP';

  @IsBoolean()
  @IsOptional()
  isInterState?: boolean;
}
