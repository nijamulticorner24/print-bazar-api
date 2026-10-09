export declare enum ProductStatusDto {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}
export declare enum ProductOptionRequirementDto {
    REQUIRED = "REQUIRED",
    OPTIONAL = "OPTIONAL",
    DISABLED = "DISABLED"
}
export declare enum ProductFieldTypeDto {
    TEXT = "TEXT",
    TEXTAREA = "TEXTAREA",
    NUMBER = "NUMBER",
    EMAIL = "EMAIL",
    PHONE = "PHONE",
    DATE = "DATE",
    TIME = "TIME",
    SELECT = "SELECT",
    MULTI_SELECT = "MULTI_SELECT",
    RADIO = "RADIO",
    CHECKBOX = "CHECKBOX",
    TOGGLE = "TOGGLE",
    FILE = "FILE",
    IMAGE = "IMAGE",
    COLOR = "COLOR",
    RANGE = "RANGE"
}
export declare enum InventoryCategoryDto {
    SUBSTRATE = "SUBSTRATE",
    BOARD = "BOARD",
    FABRIC = "FABRIC",
    VINYL = "VINYL",
    INK_CONSUMABLE = "INK_CONSUMABLE",
    PACKAGING = "PACKAGING",
    FINISHED_GOODS = "FINISHED_GOODS"
}
export declare enum StockMovementTypeDto {
    STOCK_IN = "STOCK_IN",
    ADJUSTMENT = "ADJUSTMENT",
    RESERVATION = "RESERVATION",
    RELEASE = "RELEASE",
    CONSUMPTION = "CONSUMPTION",
    RETURN = "RETURN"
}
export declare class CreateCategoryDto {
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parentId?: string | null;
    sortOrder?: number;
    isActive?: boolean;
}
export declare class UpdateCategoryDto {
    name?: string;
    slug?: string;
    description?: string;
    image?: string;
    parentId?: string | null;
    sortOrder?: number;
    isActive?: boolean;
}
export declare class CreateFieldOptionDto {
    label: string;
    value: string;
    priceModifierType?: string;
    priceModifier?: number;
    sortOrder?: number;
    isDefault?: boolean;
    isActive?: boolean;
}
export declare class UpdateFieldOptionDto {
    label?: string;
    value?: string;
    priceModifierType?: string;
    priceModifier?: number;
    sortOrder?: number;
    isDefault?: boolean;
    isActive?: boolean;
}
export declare class CreateProductFieldDto {
    label: string;
    key: string;
    type: ProductFieldTypeDto;
    description?: string;
    placeholder?: string;
    defaultValue?: string;
    isRequired?: boolean;
    isCustomerVisible?: boolean;
    isCustomerEditable?: boolean;
    sortOrder?: number;
    validationRules?: Record<string, any>;
    conditionalLogic?: {
        dependsOnFieldKey: string;
        operator: 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'GREATER_THAN' | 'LESS_THAN';
        value: any;
    };
    options?: CreateFieldOptionDto[];
}
export declare class UpdateProductFieldDto {
    label?: string;
    key?: string;
    type?: ProductFieldTypeDto;
    description?: string;
    placeholder?: string;
    defaultValue?: string;
    isRequired?: boolean;
    isCustomerVisible?: boolean;
    isCustomerEditable?: boolean;
    sortOrder?: number;
    validationRules?: Record<string, any>;
    conditionalLogic?: any;
}
export declare class CreateProductImageDto {
    url: string;
    storageKey?: string;
    altText?: string;
    caption?: string;
    sortOrder?: number;
    isPrimary?: boolean;
}
export declare class UpdateProductImageDto {
    url?: string;
    altText?: string;
    caption?: string;
    sortOrder?: number;
    isPrimary?: boolean;
}
export declare class CreateProductDto {
    categoryId: string;
    name: string;
    slug: string;
    sku: string;
    description?: string;
    status?: ProductStatusDto;
    pricingModel?: string;
    basePrice: number;
    minQuantity?: number;
    maxQuantity?: number;
    productionDays?: number;
    sortOrder?: number;
    isFeatured?: boolean;
    tags?: string[];
    seoTitle?: string;
    seoDescription?: string;
    trackInventory?: boolean;
    stockQuantity?: number;
    lowStockAlert?: number;
    defaultSize?: string;
    artworkRequirement?: ProductOptionRequirementDto;
    artworkPrice?: number;
    artworkQualityVerification?: boolean;
    minimumArtworkMegapixels?: number;
    referenceImageRequirement?: ProductOptionRequirementDto;
    designServiceRequirement?: ProductOptionRequirementDto;
    designServicePrice?: number;
    courierCharge?: number;
    freeShippingThreshold?: number;
    allowCod?: boolean;
    codSurcharge?: number;
    images?: CreateProductImageDto[];
    fields?: CreateProductFieldDto[];
}
export declare class UpdateProductDto {
    categoryId?: string;
    name?: string;
    slug?: string;
    sku?: string;
    description?: string;
    status?: ProductStatusDto;
    pricingModel?: string;
    basePrice?: number;
    minQuantity?: number;
    maxQuantity?: number;
    productionDays?: number;
    sortOrder?: number;
    isFeatured?: boolean;
    tags?: string[];
    seoTitle?: string;
    seoDescription?: string;
    trackInventory?: boolean;
    stockQuantity?: number;
    lowStockAlert?: number;
    defaultSize?: string;
    isActive?: boolean;
    artworkRequirement?: ProductOptionRequirementDto;
    artworkPrice?: number;
    artworkQualityVerification?: boolean;
    minimumArtworkMegapixels?: number;
    referenceImageRequirement?: ProductOptionRequirementDto;
    designServiceRequirement?: ProductOptionRequirementDto;
    designServicePrice?: number;
    courierCharge?: number;
    freeShippingThreshold?: number;
    allowCod?: boolean;
    codSurcharge?: number;
}
export declare class CreateInventoryItemDto {
    name: string;
    sku: string;
    category: InventoryCategoryDto;
    unit: string;
    currentStock: number;
    minStockThreshold?: number;
    costPerUnit?: number;
    location?: string;
    notes?: string;
}
export declare class UpdateInventoryItemDto {
    name?: string;
    sku?: string;
    category?: InventoryCategoryDto;
    unit?: string;
    minStockThreshold?: number;
    costPerUnit?: number;
    location?: string;
    notes?: string;
    isActive?: boolean;
}
export declare class RecordStockMovementDto {
    type: StockMovementTypeDto;
    quantity: number;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
}
export declare class CreatePricingRuleDto {
    minQty: number;
    maxQty: number;
    discountPercent?: number;
    unitPrice?: number;
    label?: string;
    attributeCombination?: Record<string, any>;
}
export declare class UpdatePricingRuleDto {
    minQty?: number;
    maxQty?: number;
    discountPercent?: number;
    unitPrice?: number;
    label?: string;
    attributeCombination?: Record<string, any>;
}
export declare class BatchPricingRulesDto {
    rules: CreatePricingRuleDto[];
}
