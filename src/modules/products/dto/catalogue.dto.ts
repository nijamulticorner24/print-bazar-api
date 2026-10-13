import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProductStatusDto {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum ProductOptionRequirementDto {
  REQUIRED = 'REQUIRED',
  OPTIONAL = 'OPTIONAL',
  DISABLED = 'DISABLED',
}

export enum ProductFieldTypeDto {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  NUMBER = 'NUMBER',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  DATE = 'DATE',
  TIME = 'TIME',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  RADIO = 'RADIO',
  CHECKBOX = 'CHECKBOX',
  TOGGLE = 'TOGGLE',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  COLOR = 'COLOR',
  RANGE = 'RANGE',
}

export enum InventoryCategoryDto {
  SUBSTRATE = 'SUBSTRATE',
  BOARD = 'BOARD',
  FABRIC = 'FABRIC',
  VINYL = 'VINYL',
  INK_CONSUMABLE = 'INK_CONSUMABLE',
  PACKAGING = 'PACKAGING',
  FINISHED_GOODS = 'FINISHED_GOODS',
}

export enum StockMovementTypeDto {
  STOCK_IN = 'STOCK_IN',
  ADJUSTMENT = 'ADJUSTMENT',
  RESERVATION = 'RESERVATION',
  RELEASE = 'RELEASE',
  CONSUMPTION = 'CONSUMPTION',
  RETURN = 'RETURN',
}

// ==========================================
// CATEGORY DTOS
// ==========================================

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  parentId?: string | null;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  parentId?: string | null;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ==========================================
// FIELD OPTION DTOS
// ==========================================

export class CreateFieldOptionDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsOptional()
  priceModifierType?: string; // FIXED, PERCENTAGE, PER_UNIT

  @IsNumber()
  @IsOptional()
  priceModifier?: number;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateFieldOptionDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  value?: string;

  @IsString()
  @IsOptional()
  priceModifierType?: string;

  @IsNumber()
  @IsOptional()
  priceModifier?: number;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ==========================================
// DYNAMIC FIELD DTOS
// ==========================================

export class CreateProductFieldDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  key: string;

  @IsEnum(ProductFieldTypeDto)
  type: ProductFieldTypeDto;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  placeholder?: string;

  @IsString()
  @IsOptional()
  defaultValue?: string;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  isCustomerVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  isCustomerEditable?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsOptional()
  validationRules?: Record<string, any>;

  @IsOptional()
  conditionalLogic?: {
    dependsOnFieldKey: string;
    operator: 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'GREATER_THAN' | 'LESS_THAN';
    value: any;
  };

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldOptionDto)
  options?: CreateFieldOptionDto[];
}

export class UpdateProductFieldDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  key?: string;

  @IsEnum(ProductFieldTypeDto)
  @IsOptional()
  type?: ProductFieldTypeDto;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  placeholder?: string;

  @IsString()
  @IsOptional()
  defaultValue?: string;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  isCustomerVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  isCustomerEditable?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsOptional()
  validationRules?: Record<string, any>;

  @IsOptional()
  conditionalLogic?: any;
}

// ==========================================
// PRODUCT IMAGE DTOS
// ==========================================

export class CreateProductImageDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  storageKey?: string;

  @IsString()
  @IsOptional()
  altText?: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class UpdateProductImageDto {
  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  altText?: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

// ==========================================
// PRODUCT DTOS
// ==========================================

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ProductStatusDto)
  @IsOptional()
  status?: ProductStatusDto;

  @IsString()
  @IsOptional()
  pricingModel?: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  minQuantity?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  quantityStep?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxQuantity?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  productionDays?: number;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  seoTitle?: string;

  @IsString()
  @IsOptional()
  seoDescription?: string;

  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @IsNumber()
  @IsOptional()
  stockQuantity?: number;

  @IsNumber()
  @IsOptional()
  lowStockAlert?: number;

  @IsString()
  @IsOptional()
  defaultSize?: string;

  // Dynamic Product Flow Engine Configuration (Admin-Controlled)
  @IsEnum(ProductOptionRequirementDto)
  @IsOptional()
  artworkRequirement?: ProductOptionRequirementDto;

  @IsNumber()
  @Min(0)
  @IsOptional()
  artworkPrice?: number;

  @IsBoolean()
  @IsOptional()
  artworkQualityVerification?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumArtworkMegapixels?: number;

  @IsEnum(ProductOptionRequirementDto)
  @IsOptional()
  referenceImageRequirement?: ProductOptionRequirementDto;

  @IsEnum(ProductOptionRequirementDto)
  @IsOptional()
  designServiceRequirement?: ProductOptionRequirementDto;

  @IsNumber()
  @Min(0)
  @IsOptional()
  designServicePrice?: number;

  // Courier & Delivery Charges Configuration (Alongside Product Configuration)
  @IsString()
  @IsOptional()
  shippingChargeType?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unitWeightGrams?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  courierCharge?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  perAdditionalQtyRate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  freeShippingThreshold?: number;

  @IsBoolean()
  @IsOptional()
  allowCod?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  codSurcharge?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  images?: CreateProductImageDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateProductFieldDto)
  fields?: CreateProductFieldDto[];
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ProductStatusDto)
  @IsOptional()
  status?: ProductStatusDto;

  @IsString()
  @IsOptional()
  pricingModel?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  basePrice?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  minQuantity?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  quantityStep?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxQuantity?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  productionDays?: number;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  seoTitle?: string;

  @IsString()
  @IsOptional()
  seoDescription?: string;

  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @IsNumber()
  @IsOptional()
  stockQuantity?: number;

  @IsNumber()
  @IsOptional()
  lowStockAlert?: number;

  @IsString()
  @IsOptional()
  defaultSize?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Dynamic Product Flow Engine Configuration (Admin-Controlled)
  @IsEnum(ProductOptionRequirementDto)
  @IsOptional()
  artworkRequirement?: ProductOptionRequirementDto;

  @IsNumber()
  @Min(0)
  @IsOptional()
  artworkPrice?: number;

  @IsBoolean()
  @IsOptional()
  artworkQualityVerification?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumArtworkMegapixels?: number;

  @IsEnum(ProductOptionRequirementDto)
  @IsOptional()
  referenceImageRequirement?: ProductOptionRequirementDto;

  @IsEnum(ProductOptionRequirementDto)
  @IsOptional()
  designServiceRequirement?: ProductOptionRequirementDto;

  @IsNumber()
  @Min(0)
  @IsOptional()
  designServicePrice?: number;

  // Courier & Delivery Charges Configuration (Alongside Product Configuration)
  @IsString()
  @IsOptional()
  shippingChargeType?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unitWeightGrams?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  courierCharge?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  perAdditionalQtyRate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  freeShippingThreshold?: number;

  @IsBoolean()
  @IsOptional()
  allowCod?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  codSurcharge?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductFieldDto)
  @IsOptional()
  fields?: CreateProductFieldDto[];
}

// ==========================================
// INVENTORY DTOS
// ==========================================

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsEnum(InventoryCategoryDto)
  category: InventoryCategoryDto;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @Min(0)
  currentStock: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minStockThreshold?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costPerUnit?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateInventoryItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsEnum(InventoryCategoryDto)
  @IsOptional()
  category?: InventoryCategoryDto;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minStockThreshold?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costPerUnit?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class RecordStockMovementDto {
  @IsEnum(StockMovementTypeDto)
  type: StockMovementTypeDto;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  referenceType?: string;

  @IsString()
  @IsOptional()
  referenceId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// ==========================================
// PRICING RULES / QUANTITY TIER OFFER DTOS
// ==========================================

export class CreatePricingRuleDto {
  @IsNumber()
  @Min(1)
  minQty: number;

  @IsNumber()
  @Min(1)
  maxQty: number;

  @IsNumber()
  @IsOptional()
  discountPercent?: number;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsString()
  @IsOptional()
  label?: string;

  @IsOptional()
  attributeCombination?: Record<string, any>;
}

export class UpdatePricingRuleDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  minQty?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxQty?: number;

  @IsNumber()
  @IsOptional()
  discountPercent?: number;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsString()
  @IsOptional()
  label?: string;

  @IsOptional()
  attributeCombination?: Record<string, any>;
}

export class BatchPricingRulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePricingRuleDto)
  rules: CreatePricingRuleDto[];
}

// ==========================================
// REUSABLE ATTRIBUTE DTOS
// ==========================================

export class CreateReusableAttributeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(ProductFieldTypeDto)
  @IsOptional()
  type?: ProductFieldTypeDto;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsNotEmpty()
  options: Array<{
    label: string;
    value: string;
    priceModifierType?: string;
    priceModifier?: number;
    isDefault?: boolean;
    isActive?: boolean;
    imageUrl?: string;
    fileCount?: number;
    fileSlotLabels?: string[];
    minMegapixels?: number;
    sortOrder?: number;
    isOptionalAddOn?: boolean;
  }>;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isOptionalAddOn?: boolean;
}

export class UpdateReusableAttributeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsEnum(ProductFieldTypeDto)
  @IsOptional()
  type?: ProductFieldTypeDto;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  options?: Array<{
    label: string;
    value: string;
    priceModifierType?: string;
    priceModifier?: number;
    isDefault?: boolean;
    isActive?: boolean;
    imageUrl?: string;
    fileCount?: number;
    fileSlotLabels?: string[];
    minMegapixels?: number;
    sortOrder?: number;
    isOptionalAddOn?: boolean;
  }>;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isOptionalAddOn?: boolean;
}

