import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    listProducts(categoryId?: string, search?: string): Promise<({
        category: {
            parent: {
                id: string;
                name: string;
                slug: string;
            } | null;
        } & {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
            description: string | null;
            image: string | null;
            sortOrder: number;
            parentId: string | null;
        };
        images: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number;
            productId: string;
            storageKey: string | null;
            isPrimary: boolean;
            url: string;
            altText: string | null;
            caption: string | null;
        }[];
        fields: ({
            options: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                sortOrder: number;
                label: string;
                value: string;
                priceModifierType: string;
                priceModifier: import("@prisma/client/runtime/library").Decimal;
                isDefault: boolean;
                fieldId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.ProductFieldType;
            description: string | null;
            sortOrder: number;
            productId: string;
            label: string;
            key: string;
            placeholder: string | null;
            defaultValue: string | null;
            isRequired: boolean;
            isCustomerVisible: boolean;
            isCustomerEditable: boolean;
            validationRules: import("@prisma/client/runtime/library").JsonValue | null;
            conditionalLogic: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        description: string | null;
        sortOrder: number;
        sku: string;
        categoryId: string;
        status: import(".prisma/client").$Enums.ProductStatus;
        pricingModel: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        minQuantity: number;
        quantityStep: number | null;
        maxQuantity: number;
        productionDays: number;
        isFeatured: boolean;
        tags: string[];
        seoTitle: string | null;
        seoDescription: string | null;
        trackInventory: boolean;
        stockQuantity: number;
        lowStockAlert: number;
        defaultSize: string | null;
        artworkRequirement: import(".prisma/client").$Enums.ProductOptionRequirement;
        artworkPrice: import("@prisma/client/runtime/library").Decimal | null;
        artworkQualityVerification: boolean;
        minimumArtworkMegapixels: number | null;
        referenceImageRequirement: import(".prisma/client").$Enums.ProductOptionRequirement;
        designServiceRequirement: import(".prisma/client").$Enums.ProductOptionRequirement;
        designServicePrice: import("@prisma/client/runtime/library").Decimal | null;
        courierCharge: import("@prisma/client/runtime/library").Decimal | null;
        freeShippingThreshold: import("@prisma/client/runtime/library").Decimal | null;
        allowCod: boolean;
        codSurcharge: import("@prisma/client/runtime/library").Decimal | null;
    })[]>;
    listCategories(): Promise<({
        _count: {
            products: number;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        description: string | null;
        image: string | null;
        sortOrder: number;
        parentId: string | null;
    })[]>;
    getProductBySlug(slug: string): Promise<{
        category: {
            parent: {
                id: string;
                name: string;
                slug: string;
            } | null;
        } & {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
            description: string | null;
            image: string | null;
            sortOrder: number;
            parentId: string | null;
        };
        images: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number;
            productId: string;
            storageKey: string | null;
            isPrimary: boolean;
            url: string;
            altText: string | null;
            caption: string | null;
        }[];
        fields: ({
            options: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                sortOrder: number;
                label: string;
                value: string;
                priceModifierType: string;
                priceModifier: import("@prisma/client/runtime/library").Decimal;
                isDefault: boolean;
                fieldId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.ProductFieldType;
            description: string | null;
            sortOrder: number;
            productId: string;
            label: string;
            key: string;
            placeholder: string | null;
            defaultValue: string | null;
            isRequired: boolean;
            isCustomerVisible: boolean;
            isCustomerEditable: boolean;
            validationRules: import("@prisma/client/runtime/library").JsonValue | null;
            conditionalLogic: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        pricingMatrices: {
            id: string;
            createdAt: Date;
            productId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            minQty: number;
            maxQty: number;
            attributeCombination: import("@prisma/client/runtime/library").JsonValue;
        }[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        description: string | null;
        sortOrder: number;
        sku: string;
        categoryId: string;
        status: import(".prisma/client").$Enums.ProductStatus;
        pricingModel: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        minQuantity: number;
        quantityStep: number | null;
        maxQuantity: number;
        productionDays: number;
        isFeatured: boolean;
        tags: string[];
        seoTitle: string | null;
        seoDescription: string | null;
        trackInventory: boolean;
        stockQuantity: number;
        lowStockAlert: number;
        defaultSize: string | null;
        artworkRequirement: import(".prisma/client").$Enums.ProductOptionRequirement;
        artworkPrice: import("@prisma/client/runtime/library").Decimal | null;
        artworkQualityVerification: boolean;
        minimumArtworkMegapixels: number | null;
        referenceImageRequirement: import(".prisma/client").$Enums.ProductOptionRequirement;
        designServiceRequirement: import(".prisma/client").$Enums.ProductOptionRequirement;
        designServicePrice: import("@prisma/client/runtime/library").Decimal | null;
        courierCharge: import("@prisma/client/runtime/library").Decimal | null;
        freeShippingThreshold: import("@prisma/client/runtime/library").Decimal | null;
        allowCod: boolean;
        codSurcharge: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}
